import { describe, it, expect } from 'vitest'
import { encryptWithECDHSecret } from './encryptWithECDHSecret'
import { deriveECDHSecret } from './deriveECDHSecret'
import { TEST_PRIVATE_KEYS, TEST_ACCOUNTS } from '../../../test/fixtures'

describe('encryptWithECDHSecret', () => {
  it('should return a hex string starting with 0x', async () => {
    const secret = await deriveECDHSecret(
      TEST_PRIVATE_KEYS.ACCOUNT_1,
      TEST_ACCOUNTS.ACCOUNT_2.publicKey
    )

    const encrypted = await encryptWithECDHSecret(secret, 'Hello World')

    expect(encrypted).toMatch(/^0x[0-9a-f]+$/)
  })

  it('should produce different outputs for the same input (random IV)', async () => {
    const secret = await deriveECDHSecret(
      TEST_PRIVATE_KEYS.ACCOUNT_1,
      TEST_ACCOUNTS.ACCOUNT_2.publicKey
    )

    const encrypted1 = await encryptWithECDHSecret(secret, 'Hello World')
    const encrypted2 = await encryptWithECDHSecret(secret, 'Hello World')

    // Should be different due to random IV
    expect(encrypted1).not.toBe(encrypted2)
  })

  it('should have correct structure: 12-byte IV + 16-byte tag + ciphertext', async () => {
    const secret = await deriveECDHSecret(
      TEST_PRIVATE_KEYS.ACCOUNT_1,
      TEST_ACCOUNTS.ACCOUNT_2.publicKey
    )

    const plaintext = 'Hello World'
    const encrypted = await encryptWithECDHSecret(secret, plaintext)

    // Remove 0x prefix
    const hex = encrypted.slice(2)

    // 12 bytes IV = 24 hex chars
    // 16 bytes tag = 32 hex chars
    // Ciphertext length = plaintext length (AES-GCM stream cipher)
    const ivLength = 24
    const tagLength = 32
    const ciphertextLength = plaintext.length * 2 // each byte = 2 hex chars

    expect(hex.length).toBe(ivLength + tagLength + ciphertextLength)
  })

  it('should encrypt different plaintexts to different ciphertexts', async () => {
    const secret = await deriveECDHSecret(
      TEST_PRIVATE_KEYS.ACCOUNT_1,
      TEST_ACCOUNTS.ACCOUNT_2.publicKey
    )

    const encrypted1 = await encryptWithECDHSecret(secret, 'Hello')
    const encrypted2 = await encryptWithECDHSecret(secret, 'World')

    expect(encrypted1).not.toBe(encrypted2)
  })

  it('should handle empty strings', async () => {
    const secret = await deriveECDHSecret(
      TEST_PRIVATE_KEYS.ACCOUNT_1,
      TEST_ACCOUNTS.ACCOUNT_2.publicKey
    )

    const encrypted = await encryptWithECDHSecret(secret, '')

    expect(encrypted).toMatch(/^0x[0-9a-f]+$/)
    // IV (24) + Tag (32) + empty ciphertext (0) = 56 hex chars + 0x
    expect(encrypted.length).toBe(58) // 0x + 56
  })

  it('should handle long messages', async () => {
    const secret = await deriveECDHSecret(
      TEST_PRIVATE_KEYS.ACCOUNT_1,
      TEST_ACCOUNTS.ACCOUNT_2.publicKey
    )

    const longMessage = 'A'.repeat(1000)
    const encrypted = await encryptWithECDHSecret(secret, longMessage)

    expect(encrypted).toMatch(/^0x[0-9a-f]+$/)
    // Should have IV + tag + ciphertext
    expect(encrypted.length).toBeGreaterThan(58)
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
    ]

    for (const message of messages) {
      const encrypted = await encryptWithECDHSecret(secret, message)
      expect(encrypted).toMatch(/^0x[0-9a-f]+$/)
    }
  })

  it('should work with different shared secrets', async () => {
    const secret1 = await deriveECDHSecret(
      TEST_PRIVATE_KEYS.ACCOUNT_1,
      TEST_ACCOUNTS.ACCOUNT_2.publicKey
    )

    const secret2 = await deriveECDHSecret(
      TEST_PRIVATE_KEYS.ACCOUNT_1,
      TEST_ACCOUNTS.ACCOUNT_3.publicKey
    )

    const plaintext = 'Same message'
    const encrypted1 = await encryptWithECDHSecret(secret1, plaintext)
    const encrypted2 = await encryptWithECDHSecret(secret2, plaintext)

    // Different secrets should produce different ciphertexts
    expect(encrypted1.slice(56)).not.toBe(encrypted2.slice(56))
  })

  it('should handle JSON strings', async () => {
    const secret = await deriveECDHSecret(
      TEST_PRIVATE_KEYS.ACCOUNT_1,
      TEST_ACCOUNTS.ACCOUNT_2.publicKey
    )

    const json = JSON.stringify({ message: 'Hello', value: 42 })
    const encrypted = await encryptWithECDHSecret(secret, json)

    expect(encrypted).toMatch(/^0x[0-9a-f]+$/)
  })
})
