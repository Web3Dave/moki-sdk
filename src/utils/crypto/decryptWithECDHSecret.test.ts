import { describe, it, expect } from 'vitest'
import { decryptWithEDCHSecret } from './decryptWithECDHSecret'
import { encryptWithECDHSecret } from './encryptWithECDHSecret'
import { deriveECDHSecret } from './deriveECDHSecret'
import { TEST_PRIVATE_KEYS, TEST_ACCOUNTS } from '../../../test/fixtures'

describe('decryptWithECDHSecret', () => {
  it('should decrypt a message encrypted with the same secret', async () => {
    const secret = await deriveECDHSecret(
      TEST_PRIVATE_KEYS.ACCOUNT_1,
      TEST_ACCOUNTS.ACCOUNT_2.publicKey
    )

    const plaintext = 'Hello World'
    const encrypted = await encryptWithECDHSecret(secret, plaintext)
    const decrypted = await decryptWithEDCHSecret(secret, encrypted.slice(2))

    expect(decrypted).toBe(plaintext)
  })

  it('should handle empty strings', async () => {
    const secret = await deriveECDHSecret(
      TEST_PRIVATE_KEYS.ACCOUNT_1,
      TEST_ACCOUNTS.ACCOUNT_2.publicKey
    )

    const plaintext = ''
    const encrypted = await encryptWithECDHSecret(secret, plaintext)
    const decrypted = await decryptWithEDCHSecret(secret, encrypted.slice(2))

    expect(decrypted).toBe(plaintext)
  })

  it('should handle long messages', async () => {
    const secret = await deriveECDHSecret(
      TEST_PRIVATE_KEYS.ACCOUNT_1,
      TEST_ACCOUNTS.ACCOUNT_2.publicKey
    )

    const plaintext = 'A'.repeat(1000)
    const encrypted = await encryptWithECDHSecret(secret, plaintext)
    const decrypted = await decryptWithEDCHSecret(secret, encrypted.slice(2))

    expect(decrypted).toBe(plaintext)
  })

  it('should handle Unicode characters', async () => {
    const secret = await deriveECDHSecret(
      TEST_PRIVATE_KEYS.ACCOUNT_1,
      TEST_ACCOUNTS.ACCOUNT_2.publicKey
    )

    const messages = [
      'Hello 世界',
      '🚀 Emoji test',
      'Special chars: @#$%^&*()',
      'Line1\nLine2\nLine3',
    ]

    for (const plaintext of messages) {
      const encrypted = await encryptWithECDHSecret(secret, plaintext)
      const decrypted = await decryptWithEDCHSecret(secret, encrypted.slice(2))
      expect(decrypted).toBe(plaintext)
    }
  })

  it('should handle JSON strings', async () => {
    const secret = await deriveECDHSecret(
      TEST_PRIVATE_KEYS.ACCOUNT_1,
      TEST_ACCOUNTS.ACCOUNT_2.publicKey
    )

    const obj = { message: 'Hello', value: 42, nested: { key: 'value' } }
    const plaintext = JSON.stringify(obj)
    const encrypted = await encryptWithECDHSecret(secret, plaintext)
    const decrypted = await decryptWithEDCHSecret(secret, encrypted.slice(2))

    expect(decrypted).toBe(plaintext)
    expect(JSON.parse(decrypted)).toEqual(obj)
  })

  it('should fail with wrong secret', async () => {
    const secret1 = await deriveECDHSecret(
      TEST_PRIVATE_KEYS.ACCOUNT_1,
      TEST_ACCOUNTS.ACCOUNT_2.publicKey
    )

    const secret2 = await deriveECDHSecret(
      TEST_PRIVATE_KEYS.ACCOUNT_1,
      TEST_ACCOUNTS.ACCOUNT_3.publicKey
    )

    const plaintext = 'Hello World'
    const encrypted = await encryptWithECDHSecret(secret1, plaintext)

    // Try to decrypt with wrong secret
    await expect(
      decryptWithEDCHSecret(secret2, encrypted.slice(2))
    ).rejects.toThrow()
  })

  it('should fail with corrupted ciphertext', async () => {
    const secret = await deriveECDHSecret(
      TEST_PRIVATE_KEYS.ACCOUNT_1,
      TEST_ACCOUNTS.ACCOUNT_2.publicKey
    )

    const plaintext = 'Hello World'
    const encrypted = await encryptWithECDHSecret(secret, plaintext)

    // Corrupt the ciphertext by flipping some bits
    const hex = encrypted.slice(2)
    const corrupted = hex.slice(0, -2) + 'ff'

    await expect(
      decryptWithEDCHSecret(secret, corrupted)
    ).rejects.toThrow()
  })

  it('should fail with corrupted IV', async () => {
    const secret = await deriveECDHSecret(
      TEST_PRIVATE_KEYS.ACCOUNT_1,
      TEST_ACCOUNTS.ACCOUNT_2.publicKey
    )

    const plaintext = 'Hello World'
    const encrypted = await encryptWithECDHSecret(secret, plaintext)

    // Corrupt the IV (first 24 hex chars)
    const hex = encrypted.slice(2)
    const corrupted = 'ff' + hex.slice(2)

    await expect(
      decryptWithEDCHSecret(secret, corrupted)
    ).rejects.toThrow()
  })

  it('should fail with corrupted auth tag', async () => {
    const secret = await deriveECDHSecret(
      TEST_PRIVATE_KEYS.ACCOUNT_1,
      TEST_ACCOUNTS.ACCOUNT_2.publicKey
    )

    const plaintext = 'Hello World'
    const encrypted = await encryptWithECDHSecret(secret, plaintext)

    // Corrupt the tag (24-56 hex chars)
    const hex = encrypted.slice(2)
    const corrupted = hex.slice(0, 24) + 'ff' + hex.slice(26)

    await expect(
      decryptWithEDCHSecret(secret, corrupted)
    ).rejects.toThrow()
  })

  it('should fail with truncated data', async () => {
    const secret = await deriveECDHSecret(
      TEST_PRIVATE_KEYS.ACCOUNT_1,
      TEST_ACCOUNTS.ACCOUNT_2.publicKey
    )

    const plaintext = 'Hello World'
    const encrypted = await encryptWithECDHSecret(secret, plaintext)

    // Truncate the encrypted data
    const hex = encrypted.slice(2, -10)

    await expect(
      decryptWithEDCHSecret(secret, hex)
    ).rejects.toThrow()
  })

  it('should handle encryption with 0x prefix and decryption without', async () => {
    const secret = await deriveECDHSecret(
      TEST_PRIVATE_KEYS.ACCOUNT_1,
      TEST_ACCOUNTS.ACCOUNT_2.publicKey
    )

    const plaintext = 'Hello World'
    const encrypted = await encryptWithECDHSecret(secret, plaintext)

    // encryptWithECDHSecret returns with 0x
    expect(encrypted.startsWith('0x')).toBe(true)

    // decryptWithECDHSecret expects without 0x
    const decrypted = await decryptWithEDCHSecret(secret, encrypted.slice(2))
    expect(decrypted).toBe(plaintext)
  })
})
