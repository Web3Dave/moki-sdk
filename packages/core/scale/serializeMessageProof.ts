
import { u8, Bytes, Struct } from "scale-ts";
import { hexToBytes } from "viem";

// Define the SCALE codec for MokiSendMessageV1
export const mokiSendMessageV1Codec = Struct({
    code: u8,
    recipient: Bytes(20),           // 20 bytes for recipient identity
    message: Bytes(),               // Vec<u8> for encrypted message payload
});

export function serializeMessageProof({ message, recipient }: {
    message: `0x${string}`,
    recipient: `0x${string}`
}): Uint8Array {

    // Convert recipient address to bytes (20 bytes for Ethereum address)
    const recipientBytes = hexToBytes(recipient as `0x${string}`);
    if (recipientBytes.length !== 20) {
        throw new Error(`Invalid recipient address length: ${recipientBytes.length}, expected 20 bytes`);
    }

    // Convert message string to UTF-8 bytes
    const messageBytes = hexToBytes(message);

    const deserializedValue = {
        code: 0,
        recipient: recipientBytes,      // 20 bytes recipient identity
        message: messageBytes,          // Vec<u8> encrypted message payload
    }

    const serializedValue = mokiSendMessageV1Codec.enc(deserializedValue);

    return serializedValue;
}