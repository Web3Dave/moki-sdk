import { describe, it, expect } from 'vitest'
import { deriveECDHSecret } from './deriveECDHSecret'
import { encryptWithECDHSecret } from './encryptWithECDHSecret'
import { decryptWithEDCHSecret } from './decryptWithECDHSecret'
import { TEST_PRIVATE_KEYS, TEST_ACCOUNTS } from '../../../../test/fixtures'

describe('Crypto Integration Tests', () => {
  describe('Full ECDH encryption flow', () => {
    it('should allow Alice to encrypt a message that Bob can decrypt', async () => {
      // Alice derives shared secret using her private key and Bob's public key
      const aliceSecret = await deriveECDHSecret(
        TEST_PRIVATE_KEYS.ACCOUNT_1,
        TEST_ACCOUNTS.ACCOUNT_2.publicKey
      )

      // Bob derives the same shared secret using his private key and Alice's public key
      const bobSecret = await deriveECDHSecret(
        TEST_PRIVATE_KEYS.ACCOUNT_2,
        TEST_ACCOUNTS.ACCOUNT_1.publicKey
      )

      const plaintext = 'Hello Bob, this is Alice!'

      // Alice encrypts with her derived secret
      const encrypted = await encryptWithECDHSecret(aliceSecret, plaintext)

      // Bob decrypts with his derived secret
      const decrypted = await decryptWithEDCHSecret(bobSecret, encrypted.slice(2))

      expect(decrypted).toBe(plaintext)
    })

    it('should allow bidirectional encrypted communication', async () => {
      // Alice and Bob derive shared secrets
      const aliceSecret = await deriveECDHSecret(
        TEST_PRIVATE_KEYS.ACCOUNT_1,
        TEST_ACCOUNTS.ACCOUNT_2.publicKey
      )

      const bobSecret = await deriveECDHSecret(
        TEST_PRIVATE_KEYS.ACCOUNT_2,
        TEST_ACCOUNTS.ACCOUNT_1.publicKey
      )

      // Alice sends message to Bob
      const aliceMessage = 'Hello Bob!'
      const aliceEncrypted = await encryptWithECDHSecret(aliceSecret, aliceMessage)
      const bobDecrypted = await decryptWithEDCHSecret(bobSecret, aliceEncrypted.slice(2))
      expect(bobDecrypted).toBe(aliceMessage)

      // Bob sends message to Alice
      const bobMessage = 'Hi Alice!'
      const bobEncrypted = await encryptWithECDHSecret(bobSecret, bobMessage)
      const aliceDecrypted = await decryptWithEDCHSecret(aliceSecret, bobEncrypted.slice(2))
      expect(aliceDecrypted).toBe(bobMessage)
    })

    it('should prevent third party from decrypting messages', async () => {
      // Alice and Bob derive shared secret
      const aliceSecret = await deriveECDHSecret(
        TEST_PRIVATE_KEYS.ACCOUNT_1,
        TEST_ACCOUNTS.ACCOUNT_2.publicKey
      )

      // Charlie tries to derive a secret (but with wrong key)
      const charlieSecret = await deriveECDHSecret(
        TEST_PRIVATE_KEYS.ACCOUNT_3,
        TEST_ACCOUNTS.ACCOUNT_1.publicKey
      )

      const plaintext = 'Secret message'
      const encrypted = await encryptWithECDHSecret(aliceSecret, plaintext)

      // Charlie cannot decrypt with wrong secret
      await expect(
        decryptWithEDCHSecret(charlieSecret, encrypted.slice(2))
      ).rejects.toThrow()
    })

    it('should handle multiple sequential messages', async () => {
      const secret = await deriveECDHSecret(
        TEST_PRIVATE_KEYS.ACCOUNT_1,
        TEST_ACCOUNTS.ACCOUNT_2.publicKey
      )

      const messages = [
        'First message',
        'Second message',
        'Third message',
        'Fourth message',
        'Fifth message',
      ]

      for (const plaintext of messages) {
        const encrypted = await encryptWithECDHSecret(secret, plaintext)
        const decrypted = await decryptWithEDCHSecret(secret, encrypted.slice(2))
        expect(decrypted).toBe(plaintext)
      }
    })

    it('should handle complex data structures', async () => {
      const secret = await deriveECDHSecret(
        TEST_PRIVATE_KEYS.ACCOUNT_1,
        TEST_ACCOUNTS.ACCOUNT_2.publicKey
      )

      const complexData = {
        type: 'transaction',
        from: TEST_ACCOUNTS.ACCOUNT_1.address,
        to: TEST_ACCOUNTS.ACCOUNT_2.address,
        value: '1000000000000000000',
        data: {
          method: 'transfer',
          params: ['0x123', 100],
        },
        metadata: {
          timestamp: Date.now(),
          nonce: 42,
        },
      }

      const plaintext = JSON.stringify(complexData)
      const encrypted = await encryptWithECDHSecret(secret, plaintext)
      const decrypted = await decryptWithEDCHSecret(secret, encrypted.slice(2))

      expect(JSON.parse(decrypted)).toEqual(complexData)
    })

    it('should maintain security with reused secrets', async () => {
      const secret = await deriveECDHSecret(
        TEST_PRIVATE_KEYS.ACCOUNT_1,
        TEST_ACCOUNTS.ACCOUNT_2.publicKey
      )

      const plaintext = 'Same message'

      // Encrypt same message twice
      const encrypted1 = await encryptWithECDHSecret(secret, plaintext)
      const encrypted2 = await encryptWithECDHSecret(secret, plaintext)

      // Should produce different ciphertexts (due to random IV)
      expect(encrypted1).not.toBe(encrypted2)

      // But both should decrypt correctly
      const decrypted1 = await decryptWithEDCHSecret(secret, encrypted1.slice(2))
      const decrypted2 = await decryptWithEDCHSecret(secret, encrypted2.slice(2))

      expect(decrypted1).toBe(plaintext)
      expect(decrypted2).toBe(plaintext)
    })

    it('should work with all combinations of test accounts', async () => {
      const accounts = [
        TEST_PRIVATE_KEYS.ACCOUNT_1,
        TEST_PRIVATE_KEYS.ACCOUNT_2,
        TEST_PRIVATE_KEYS.ACCOUNT_3,
        TEST_PRIVATE_KEYS.RPC_SERVICE,
      ]

      const publicKeys = [
        TEST_ACCOUNTS.ACCOUNT_1.publicKey,
        TEST_ACCOUNTS.ACCOUNT_2.publicKey,
        TEST_ACCOUNTS.ACCOUNT_3.publicKey,
        TEST_ACCOUNTS.RPC_SERVICE.publicKey,
      ]

      for (let i = 0; i < accounts.length; i++) {
        for (let j = 0; j < publicKeys.length; j++) {
          if (i === j) continue // Skip same account

          const senderSecret = await deriveECDHSecret(accounts[i], publicKeys[j])
          const receiverSecret = await deriveECDHSecret(accounts[j], publicKeys[i])

          const plaintext = `Message from ${i} to ${j}`
          const encrypted = await encryptWithECDHSecret(senderSecret, plaintext)
          const decrypted = await decryptWithEDCHSecret(receiverSecret, encrypted.slice(2))

          expect(decrypted).toBe(plaintext)
        }
      }
    })
  })

  describe('Edge cases and error handling', () => {
    it('should handle very large messages', async () => {
      const secret = await deriveECDHSecret(
        TEST_PRIVATE_KEYS.ACCOUNT_1,
        TEST_ACCOUNTS.ACCOUNT_2.publicKey
      )

      // 10KB message
      const plaintext = 'A'.repeat(10_000)
      const encrypted = await encryptWithECDHSecret(secret, plaintext)
      const decrypted = await decryptWithEDCHSecret(secret, encrypted.slice(2))

      expect(decrypted).toBe(plaintext)
    })

    it('should reject decryption with incorrect message format', async () => {
      const secret = await deriveECDHSecret(
        TEST_PRIVATE_KEYS.ACCOUNT_1,
        TEST_ACCOUNTS.ACCOUNT_2.publicKey
      )

      // Too short (missing components)
      await expect(
        decryptWithEDCHSecret(secret, 'abc123')
      ).rejects.toThrow()

      // Empty string
      await expect(
        decryptWithEDCHSecret(secret, '')
      ).rejects.toThrow()
    })

    it('should produce cryptographically secure IV for each encryption', async () => {
      const secret = await deriveECDHSecret(
        TEST_PRIVATE_KEYS.ACCOUNT_1,
        TEST_ACCOUNTS.ACCOUNT_2.publicKey
      )

      const plaintext = 'Test'
      const ivs = new Set<string>()

      // Collect 100 IVs
      for (let i = 0; i < 100; i++) {
        const encrypted = await encryptWithECDHSecret(secret, plaintext)
        const iv = encrypted.slice(2, 26) // First 12 bytes (24 hex chars)
        ivs.add(iv)
      }

      // All IVs should be unique (with very high probability)
      expect(ivs.size).toBe(100)
    })
  })
})
