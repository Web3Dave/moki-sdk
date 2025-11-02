import { hexToBytes } from "viem/utils";
import { authorizationHeaderCodec } from "./codec/authorizationHeader";

export function serializeAuthorizationHeader({
    authorizationType,
    timestampId,
    identity
}: {
    authorizationType: string,
    timestampId: number,
    identity: `0x${string}`
}): Uint8Array {

    // Convert authorization type to UTF-8 bytes
    const encoder = new TextEncoder();
    const authorizationTypeBytes = encoder.encode(authorizationType);

    // Convert timestamp to 6-byte big-endian format, padded with zeros
    const timestampBuffer = new ArrayBuffer(8);
    const timestampView = new DataView(timestampBuffer);
    timestampView.setBigUint64(0, BigInt(timestampId), false); // false = big-endian

    // Extract the last 6 bytes (right-most) from the 8-byte buffer
    const timestampBytes = new Uint8Array(timestampBuffer.slice(2)); // Skip first 2 bytes to get 6 bytes

    // Convert identity address to bytes (20 bytes for Ethereum address)
    const identityBytes = hexToBytes(identity);
    if (identityBytes.length !== 20) {
        throw new Error(`Invalid identity address length: ${identityBytes.length}, expected 20 bytes`);
    }

    const payload = {
        authorization_type: authorizationTypeBytes,
        timestamp_id: timestampBytes,
        identity: identityBytes,
    };

    return authorizationHeaderCodec.enc(payload);
}