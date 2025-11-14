import { describe, it, expect } from 'vitest'
import { compressPublicKey } from './compressPublicKey'
import { decompressPublicKey } from './decompressPublicKey'
import { TEST_ACCOUNTS } from '../../../test/fixtures'

describe('compressPublicKey and decompressPublicKey', () => {
  it('should compress an uncompressed public key to 33 bytes', () => {
    const uncompressed = TEST_ACCOUNTS.ACCOUNT_1.publicKey
    const compressed = compressPublicKey(uncompressed)

    expect(compressed).toMatch(/^0x[0-9a-f]+$/)
    expect(compressed.length).toBe(68) // 0x + 66 hex chars (33 bytes)
  })

  it('should decompress a compressed public key to 65 bytes', () => {
    const uncompressed = TEST_ACCOUNTS.ACCOUNT_1.publicKey
    const compressed = compressPublicKey(uncompressed)
    const decompressed = decompressPublicKey(compressed)

    expect(decompressed).toMatch(/^0x[0-9a-f]+$/)
    expect(decompressed.length).toBe(132) // 0x + 130 hex chars (65 bytes)
  })

  it('should be reversible: decompress(compress(key)) === key', () => {
    const original = TEST_ACCOUNTS.ACCOUNT_1.publicKey
    const compressed = compressPublicKey(original)
    const decompressed = decompressPublicKey(compressed)

    expect(decompressed).toBe(original)
  })

  it('should work with all test accounts', () => {
    const accounts = [
      TEST_ACCOUNTS.ACCOUNT_1,
      TEST_ACCOUNTS.ACCOUNT_2,
      TEST_ACCOUNTS.ACCOUNT_3,
      TEST_ACCOUNTS.RPC_SERVICE,
    ]

    for (const account of accounts) {
      const compressed = compressPublicKey(account.publicKey)
      const decompressed = decompressPublicKey(compressed)
      expect(decompressed).toBe(account.publicKey)
    }
  })
})
