import { secp256k1 } from "@noble/curves/secp256k1";
import { hexToBytes } from "viem";

export async function deriveECDHSecret(privateKeyHex: `0x${string}`, publicKeyHex: `0x${string}`) {
    const rawSecret = secp256k1.getSharedSecret(
        hexToBytes(privateKeyHex),
        hexToBytes(publicKeyHex),
        true // compressed = true
    );

    // Hash 33-byte shared secret
    const hashed = await crypto.subtle.digest("SHA-256", new Uint8Array(rawSecret));

    return new Uint8Array(hashed);
}