import { describe, it, expect } from 'vitest'
import { privateKeyToMokiAccount } from './privateKeyToMokiAccount.js'
import { TEST_PRIVATE_KEYS, TEST_ACCOUNTS } from '../../../test/fixtures.js'

describe('privateKeyToMokiAccount', () => {
  const testPrivateKey = TEST_PRIVATE_KEYS.ACCOUNT_1

  it('should create a MokiAccount from a private key', () => {
    const account = privateKeyToMokiAccount(testPrivateKey)

    expect(account).toBeDefined()
    expect(account.address).toMatch(/^0x[a-fA-F0-9]{40}$/)
    expect(account.publicKey).toMatch(/^0x[a-fA-F0-9]+$/)
    expect(typeof account.signMessage).toBe('function')
    expect(typeof account.deriveECDHSecret).toBe('function')
  })

  it('should have correct address for known private key', () => {
    const account = privateKeyToMokiAccount(testPrivateKey)

    // This is the deterministic address for the test private key
    expect(account.address).toBe('0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266')
  })

  it('should sign messages', async () => {
    const account = privateKeyToMokiAccount(testPrivateKey)

    const signature = await account.signMessage({ message: 'Hello Moki' })

    expect(signature).toMatch(/^0x[a-fA-F0-9]+$/)
    expect(signature.length).toBeGreaterThan(2)
  })

  it('should derive ECDH secret with another public key', async () => {
    const account = privateKeyToMokiAccount(testPrivateKey)
    // Use a valid secp256k1 public key (from another known private key)
    const otherPrivateKey = '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d' as `0x${string}`
    const otherAccount = privateKeyToMokiAccount(otherPrivateKey)

    const secret = await account.deriveECDHSecret(otherAccount.publicKey)

    expect(secret).toBeInstanceOf(Uint8Array)
    expect(secret.length).toBeGreaterThan(0)
  })

  it('should produce consistent results for same private key', () => {
    const account1 = privateKeyToMokiAccount(testPrivateKey)
    const account2 = privateKeyToMokiAccount(testPrivateKey)

    expect(account1.address).toBe(account2.address)
    expect(account1.publicKey).toBe(account2.publicKey)
  })

  it('should produce different addresses for different private keys', () => {
    const account1 = privateKeyToMokiAccount(testPrivateKey)
    const account2 = privateKeyToMokiAccount(TEST_PRIVATE_KEYS.ACCOUNT_2)

    expect(account1.address).not.toBe(account2.address)
    expect(account1.publicKey).not.toBe(account2.publicKey)
  })
})
