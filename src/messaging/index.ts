import { MokiProvider, MokiRpcMethods } from "../provider";
import { createMemoryPersistor } from "../persistor"
import { MokiAccount } from "../accounts/types"
import { MokiRPCIdentity } from "../types/identity"
import { serializeMessageProof } from "../scale/serializeMessageProof";
import { publicKeyToAddress, bytesToHex } from "viem/utils";
import { decompressPublicKey } from "../utils/publicKey";
import { encryptWithECDHSecret } from "../utils/crypto/encryptWithECDHSecret";
import { serializeAuthorizationHeader } from "../scale/serializeAuthorizationHeader";
import { MokiMessage, MokiRPCChat, MokiRPCMessage } from "../types/message";
import { decryptRPCMessage } from "../data/decryptRPCMessage";

export type MessageClientOptions = {
    account: MokiAccount,
    delegateAccount?: MokiAccount,
    dangerouslyUseAccountAsDelegate?: boolean,
}

export type MessageClient = {
    sendMessage: (username: string, message: string) => Promise<MokiMessage>
    getBlock: () => Promise<`0x${string}`>
    getIdentityFromAddress: (address: `0x${string}`) => Promise<MokiRPCIdentity | undefined>
    getIdentityFromUsername: (username: `@${string}`) => Promise<MokiRPCIdentity | undefined>
    getLatestChat: (username: string) => Promise<{ data: MokiMessage[], end: boolean }>
    watchChat: (username: string, messageCallback: (message: MokiMessage[]) => void) => () => void
}

export function createMessageClient(provider: MokiProvider, options: MessageClientOptions): MessageClient {

    const persistor = createMemoryPersistor()

    if (options.dangerouslyUseAccountAsDelegate !== true && !options?.delegateAccount) throw Error("options.delegateAccount must be defined. or enable dangerouslyUseAccountAsDelegate")
    const delegateAccount: MokiAccount = options.dangerouslyUseAccountAsDelegate ? options.account : options.delegateAccount as MokiAccount;

    const getIdentityFromUsername = async (username: string): Promise<MokiRPCIdentity> => {
        if (!persistor.has(username)) {
            const identity = provider.request<MokiRPCIdentity>({ method: MokiRpcMethods.MOKI_GET_IDENTITY_BY_USERNAME, params: [username] });
            if (identity === undefined) throw Error("Could not fetch identity")
            persistor.set(username, identity)
            persistor.set(username, identity)
            return identity;
        }
        else {
            return persistor.get(username)
        }
    }

    const getAuthorizationHeader = async (): Promise<`0x${string}`> => {
        const payload = serializeAuthorizationHeader({ authorizationType: "AUTHORIZE", timestampId: Date.now(), identity: delegateAccount.address });
        const signedPayload = (await delegateAccount.signMessage({ message: { raw: payload } }));
        return bytesToHex(payload) + signedPayload.slice(2) as `0x${string}`
    }

    return {
        getBlock: () => provider.request({ method: MokiRpcMethods.ETH_GET_BLOCK }),
        sendMessage: async (username, message) => {
            const recipientIdentity = await getIdentityFromUsername(username);
            const uncompressedPublicKey = decompressPublicKey(recipientIdentity.public_key);
            const address = publicKeyToAddress(uncompressedPublicKey);
            const ecdhSecret = await delegateAccount.deriveECDHSecret(uncompressedPublicKey);
            const encryptedMessage = await encryptWithECDHSecret(ecdhSecret, message)
            const messageProof = serializeMessageProof({ message: encryptedMessage, recipient: address });
            const signature = (await delegateAccount.signMessage({ message: { raw: messageProof } }));
            const signedMessage = bytesToHex(messageProof) + signature.replace("0x", "");
            const response = await provider.request<MokiRPCMessage>({ method: MokiRpcMethods.MOKI_SERVICE_SEND_MESSAGE, params: [signedMessage] });

            const formattedMessage = await decryptRPCMessage(ecdhSecret, response)
            return formattedMessage
        },
        getIdentityFromAddress: async (address) => {
            if (!persistor.has(address)) {
                const identity = provider.request<MokiRPCIdentity>({ method: MokiRpcMethods.MOKI_GET_IDENTITY, params: [address] });
                persistor.set(address, identity)
                return identity;
            }
            else {
                return persistor.get(address)
            }
        },
        getIdentityFromUsername,
        getLatestChat: async (username) => {
            const chatIdentity = await getIdentityFromUsername(username);
            const uncompressedPublicKey = decompressPublicKey(chatIdentity.public_key);
            const chatAddress = publicKeyToAddress(decompressPublicKey(chatIdentity.public_key));
            const authorizationHeader = await getAuthorizationHeader();
            const latestChatResponse = await provider.request<MokiRPCChat>({ method: MokiRpcMethods.MOKI_SERVICE_GET_CHAT, params: [chatAddress.toLowerCase()], authorizationHeader });

            const messages = latestChatResponse.data
            const decryptedMessages = [] as MokiMessage[];

            const ecdhSecret = await delegateAccount.deriveECDHSecret(uncompressedPublicKey);

            for (let message of messages) {
                decryptedMessages.push(await decryptRPCMessage(ecdhSecret, message))
            }
            return {
                data: decryptedMessages,
                end: latestChatResponse.end
            }

        },
        watchChat: (username, onMessageReceived) => {
            let latestMessageId = Date.now().toString() + "0".repeat(10) // Begin with timestamp only, pad to messageId length
            let isActive = true;

            const poll = async () => {
                while (isActive) {
                    try {
                        const chatIdentity = await getIdentityFromUsername(username);
                        const uncompressedPublicKey = decompressPublicKey(chatIdentity.public_key);
                        const chatAddress = publicKeyToAddress(uncompressedPublicKey);
                        const authorizationHeader = await getAuthorizationHeader();
                        const latestChatResponse = await provider.request<MokiRPCChat>({
                            method: MokiRpcMethods.MOKI_SERVICE_GET_CHAT,
                            params: [chatAddress.toLowerCase(), { after: latestMessageId }],
                            authorizationHeader
                        });

                        if (latestChatResponse.data.length > 0) {
                            const decryptedMessages = [] as MokiMessage[];
                            const ecdhSecret = await delegateAccount.deriveECDHSecret(uncompressedPublicKey);

                            // Update latestMessageId to avoid refetching
                            latestMessageId = latestChatResponse.data[0].id;

                            for (let message of latestChatResponse.data) {
                                try {
                                    const decryptedMessage = await decryptRPCMessage(ecdhSecret, message);
                                    decryptedMessages.push(decryptedMessage);
                                } catch (error) {
                                    console.error("Error decrypting message:", error);
                                }
                            }

                            if (decryptedMessages.length > 0) {
                                onMessageReceived(decryptedMessages);
                            }
                        }
                    } catch (error) {
                        console.error("Error polling chat:", error);
                    }

                    await new Promise(resolve => setTimeout(resolve, 5000));
                }
            };

            poll();

            return () => {
                isActive = false;
            };
        }
    }
}