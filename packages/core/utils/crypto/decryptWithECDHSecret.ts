import { hexToBytes } from 'viem';

export async function decryptWithEDCHSecret(
    sharedSecret: Uint8Array,
    encryptedCombo: string
) {
    const ivHex = encryptedCombo.slice(0, 24);    // 12 bytes IV (24 hex chars)
    const tagHex = encryptedCombo.slice(24, 56);  // 16 bytes tag (32 hex chars)
    const cipherHex = encryptedCombo.slice(56);   // Rest is ciphertext

    const iv = hexToBytes(`0x${ivHex}`);
    const tag = hexToBytes(`0x${tagHex}`);
    const ciphertext = hexToBytes(`0x${cipherHex}`);

    // WebCrypto expects auth tag to be **appended** to ciphertext
    const fullEncrypted = new Uint8Array(ciphertext.length + tag.length);
    fullEncrypted.set(ciphertext);
    fullEncrypted.set(tag, ciphertext.length);

    const key = await crypto.subtle.importKey(
        'raw',
        new Uint8Array(sharedSecret),
        { name: 'AES-GCM' },
        false,
        ['decrypt']
    );

    const decrypted = await crypto.subtle.decrypt(
        {
            name: 'AES-GCM',
            iv: new Uint8Array(iv),
        },
        key,
        new Uint8Array(fullEncrypted)
    );

    return new TextDecoder().decode(decrypted);
}
