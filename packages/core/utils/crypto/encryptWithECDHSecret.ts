import { bytesToHex, toBytes } from "viem/utils";

export async function encryptWithECDHSecret(
    sharedSecret: Uint8Array,
    content: string
) {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const dataBytes = toBytes(content);

    // Import raw AES key
    const key = await crypto.subtle.importKey(
        "raw",
        new Uint8Array(sharedSecret),
        { name: "AES-GCM" },
        false,
        ["encrypt"]
    );

    // Encrypt data
    const encryptedBuffer = await crypto.subtle.encrypt(
        {
            name: "AES-GCM",
            iv,
            tagLength: 128,
        },
        key,
        new Uint8Array(dataBytes)
    );

    const encryptedBytes = new Uint8Array(encryptedBuffer);

    // WebCrypto appends the 16-byte auth tag to the end of the ciphertext
    const ciphertext = encryptedBytes.slice(0, encryptedBytes.length - 16);
    const authTag = encryptedBytes.slice(encryptedBytes.length - 16);

    const finalHex =
        bytesToHex(iv) + bytesToHex(authTag).slice(2) + bytesToHex(ciphertext).slice(2);

    return finalHex as `0x${string}`;
}