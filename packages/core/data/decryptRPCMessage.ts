import { bytesToHex, hexToBytes, recoverMessageAddress, toHex } from "viem";
import { decryptWithEDCHSecret } from "../utils/crypto/decryptWithECDHSecret";
import { messageV1Codec } from "../scale/codec/messageV1";
import { MokiMessage, MokiMessagePayload } from "../types/message";

const supportedMessageTypes = ["00"]

export async function decryptRPCMessage(sharedSecret: Uint8Array<ArrayBufferLike>, { id, signed_payload, receipt }: { id: `${number}`, signed_payload: `0x${string}`, receipt: `0x${string}` }): Promise<MokiMessage> {

    let messageObj = {};

    const rawHex = signed_payload.replace("0x", "");

    // Extract signature (last 65 bytes = 130 hex characters)
    const signature = rawHex.slice(-130);

    // Extract serialized data (everything except the signature)
    const serializedData = rawHex.slice(0, -130);

    // Type code: First byte
    const type = serializedData.slice(0, 2);

    // Derive sender address from signature and serialized data
    // Use the raw serialized data bytes for recovery
    const serializedDataBytes = hexToBytes(`0x${serializedData}`);
    const sender = (await recoverMessageAddress({
        message: { raw: serializedDataBytes },
        signature: `0x${signature}` as `0x${string}`
    })).toLowerCase() as `0x${string}`;

    if (!supportedMessageTypes.includes(type)) throw Error(`Unsupported message type '${type}'`);

    switch (type) {
        case "00": {
            const deserialized = messageV1Codec.dec("0x" + serializedData)
            let decryptedMessage = "";
            try {
                decryptedMessage = await decryptWithEDCHSecret(sharedSecret, bytesToHex(deserialized.message).replace("0x", ""))
            } catch (error) {
                console.error(`Failed to decrypt message "${id}":`, error);
            }
            messageObj = {
                code: deserialized.code,
                message: decryptedMessage,
                recipient: toHex(deserialized.recipient),
            } as MokiMessagePayload
        }
    }


    return {
        id,
        sender,
        payload: messageObj as MokiMessagePayload,
        receipt,
        timestamp: parseInt(id.slice(0, -10))
    }
}