import { describe, it, expect } from 'vitest'
import { deriveECDHSecret } from './deriveECDHSecret'
import { TEST_PRIVATE_KEYS, TEST_ACCOUNTS } from '../../../test/fixtures'
import { bytesToHex } from 'viem'

describe('deriveECDHSecret', () => {
  it('should derive a 32-byte shared secret', async () => {
    const secret = await deriveECDHSecret(
      TEST_PRIVATE_KEYS.ACCOUNT_1,
      TEST_ACCOUNTS.ACCOUNT_2.publicKey
    )

    expect(secret).toBeInstanceOf(Uint8Array)
    expect(secret.length).toBe(32) // SHA-256 output
  })

  it('should derive the same secret regardless of which party derives it', async () => {
    // Alice derives secret using her private key and Bob's public key
    const secretAlice = await deriveECDHSecret(
      TEST_PRIVATE_KEYS.ACCOUNT_1,
      TEST_ACCOUNTS.ACCOUNT_2.publicKey
    )

    // Bob derives secret using his private key and Alice's public key
    const secretBob = await deriveECDHSecret(
      TEST_PRIVATE_KEYS.ACCOUNT_2,
      TEST_ACCOUNTS.ACCOUNT_1.publicKey
    )

    expect(bytesToHex(secretAlice)).toBe(bytesToHex(secretBob))
  })

  it('should derive different secrets for different key pairs', async () => {
    const secret1 = await deriveECDHSecret(
      TEST_PRIVATE_KEYS.ACCOUNT_1,
      TEST_ACCOUNTS.ACCOUNT_2.publicKey
    )

    const secret2 = await deriveECDHSecret(
      TEST_PRIVATE_KEYS.ACCOUNT_1,
      TEST_ACCOUNTS.ACCOUNT_3.publicKey
    )

    expect(bytesToHex(secret1)).not.toBe(bytesToHex(secret2))
  })

  it('should be deterministic for the same inputs', async () => {
    const secret1 = await deriveECDHSecret(
      TEST_PRIVATE_KEYS.ACCOUNT_1,
      TEST_ACCOUNTS.ACCOUNT_2.publicKey
    )

    const secret2 = await deriveECDHSecret(
      TEST_PRIVATE_KEYS.ACCOUNT_1,
      TEST_ACCOUNTS.ACCOUNT_2.publicKey
    )

    expect(bytesToHex(secret1)).toBe(bytesToHex(secret2))
  })

  it('should work with all test accounts', async () => {
    const accounts = [
      { priv: TEST_PRIVATE_KEYS.ACCOUNT_1, pub: TEST_ACCOUNTS.ACCOUNT_2.publicKey },
      { priv: TEST_PRIVATE_KEYS.ACCOUNT_2, pub: TEST_ACCOUNTS.ACCOUNT_3.publicKey },
      { priv: TEST_PRIVATE_KEYS.ACCOUNT_3, pub: TEST_ACCOUNTS.RPC_SERVICE.publicKey },
      { priv: TEST_PRIVATE_KEYS.RPC_SERVICE, pub: TEST_ACCOUNTS.ACCOUNT_1.publicKey },
    ]

    for (const { priv, pub } of accounts) {
      const secret = await deriveECDHSecret(priv, pub)
      expect(secret).toBeInstanceOf(Uint8Array)
      expect(secret.length).toBe(32)
    }
  })

  it('should produce cryptographically strong output', async () => {
    const secret = await deriveECDHSecret(
      TEST_PRIVATE_KEYS.ACCOUNT_1,
      TEST_ACCOUNTS.ACCOUNT_2.publicKey
    )

    // Secret should not be all zeros
    const allZeros = new Uint8Array(32).every(b => b === 0)
    expect(secret.every(b => b === 0)).not.toBe(allZeros)

    // Secret should have some entropy (not all same byte)
    const uniqueBytes = new Set(secret).size
    expect(uniqueBytes).toBeGreaterThan(1)
  })
})
