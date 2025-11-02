import { describe, it, expect } from 'vitest'
import { serializeAuthorizationHeader } from './serializeAuthorizationHeader'
import { authorizationHeaderCodec } from './codec/authorizationHeader'
import { bytesToHex } from 'viem/utils'
import { TEST_ACCOUNTS } from '../../test/fixtures'

describe('serializeAuthorizationHeader', () => {
  const testIdentity = TEST_ACCOUNTS.ACCOUNT_1.address

  it('should serialize authorization header with AUTHORIZE type', () => {
    const result = serializeAuthorizationHeader({
      authorizationType: 'AUTHORIZE',
      timestampId: 1699000000000,
      identity: testIdentity
    })

    expect(result).toBeInstanceOf(Uint8Array)
    expect(result.length).toBeGreaterThan(0)
  })

  it('should encode authorization type as UTF-8 bytes', () => {
    const result = serializeAuthorizationHeader({
      authorizationType: 'AUTHORIZE',
      timestampId: Date.now(),
      identity: testIdentity
    })

    // Decode to verify structure
    const decoded = authorizationHeaderCodec.dec(result)

    const authTypeString = new TextDecoder().decode(decoded.authorization_type)
    expect(authTypeString).toBe('AUTHORIZE')
  })

  it('should encode timestamp as 6 bytes big-endian', () => {
    const timestampId = 1699000000000 // Specific timestamp

    const result = serializeAuthorizationHeader({
      authorizationType: 'AUTHORIZE',
      timestampId,
      identity: testIdentity
    })

    const decoded = authorizationHeaderCodec.dec(result)

    expect(decoded.timestamp_id).toBeInstanceOf(Uint8Array)
    expect(decoded.timestamp_id.length).toBe(6)

    // Verify the timestamp can be reconstructed
    const view = new DataView(new Uint8Array([0, 0, ...decoded.timestamp_id]).buffer)
    const reconstructedTimestamp = Number(view.getBigUint64(0, false))
    expect(reconstructedTimestamp).toBe(timestampId)
  })

  it('should encode identity as 20 bytes', () => {
    const result = serializeAuthorizationHeader({
      authorizationType: 'AUTHORIZE',
      timestampId: Date.now(),
      identity: testIdentity
    })

    const decoded = authorizationHeaderCodec.dec(result)

    expect(decoded.identity).toBeInstanceOf(Uint8Array)
    expect(decoded.identity.length).toBe(20)
    expect(bytesToHex(decoded.identity)).toBe(testIdentity.toLowerCase())
  })

  it('should throw error for invalid identity address length', () => {
    const invalidIdentity = '0x123' as `0x${string}` // Too short

    expect(() => {
      serializeAuthorizationHeader({
        authorizationType: 'AUTHORIZE',
        timestampId: Date.now(),
        identity: invalidIdentity
      })
    }).toThrow('Invalid identity address length')
  })

  it('should handle different authorization types', () => {
    const types = ['AUTHORIZE', 'REVOKE', 'UPDATE']

    types.forEach(type => {
      const result = serializeAuthorizationHeader({
        authorizationType: type,
        timestampId: Date.now(),
        identity: testIdentity
      })

      const decoded = authorizationHeaderCodec.dec(result)
      const authTypeString = new TextDecoder().decode(decoded.authorization_type)
      expect(authTypeString).toBe(type)
    })
  })

  it('should produce deterministic output for same inputs', () => {
    const params = {
      authorizationType: 'AUTHORIZE',
      timestampId: 1699000000000,
      identity: testIdentity
    }

    const result1 = serializeAuthorizationHeader(params)
    const result2 = serializeAuthorizationHeader(params)

    expect(bytesToHex(result1)).toBe(bytesToHex(result2))
  })

  it('should produce different output for different timestamps', () => {
    const timestamp1 = 1699000000000
    const timestamp2 = 1699000001000

    const result1 = serializeAuthorizationHeader({
      authorizationType: 'AUTHORIZE',
      timestampId: timestamp1,
      identity: testIdentity
    })

    const result2 = serializeAuthorizationHeader({
      authorizationType: 'AUTHORIZE',
      timestampId: timestamp2,
      identity: testIdentity
    })

    expect(bytesToHex(result1)).not.toBe(bytesToHex(result2))
  })

  it('should produce different output for different identities', () => {
    const identity1 = TEST_ACCOUNTS.ACCOUNT_1.address
    const identity2 = TEST_ACCOUNTS.ACCOUNT_2.address

    const result1 = serializeAuthorizationHeader({
      authorizationType: 'AUTHORIZE',
      timestampId: Date.now(),
      identity: identity1
    })

    const result2 = serializeAuthorizationHeader({
      authorizationType: 'AUTHORIZE',
      timestampId: Date.now(),
      identity: identity2
    })

    expect(bytesToHex(result1)).not.toBe(bytesToHex(result2))
  })

  it('should handle empty authorization type', () => {
    const result = serializeAuthorizationHeader({
      authorizationType: '',
      timestampId: Date.now(),
      identity: testIdentity
    })

    const decoded = authorizationHeaderCodec.dec(result)
    const authTypeString = new TextDecoder().decode(decoded.authorization_type)
    expect(authTypeString).toBe('')
  })

  it('should handle maximum timestamp value', () => {
    // Max value that fits in 6 bytes (48 bits)
    const maxTimestamp = (2 ** 48) - 1

    const result = serializeAuthorizationHeader({
      authorizationType: 'AUTHORIZE',
      timestampId: maxTimestamp,
      identity: testIdentity
    })

    const decoded = authorizationHeaderCodec.dec(result)
    const view = new DataView(new Uint8Array([0, 0, ...decoded.timestamp_id]).buffer)
    const reconstructedTimestamp = Number(view.getBigUint64(0, false))
    expect(reconstructedTimestamp).toBe(maxTimestamp)
  })

  it('should be reversible through decode', () => {
    const original = {
      authorizationType: 'AUTHORIZE',
      timestampId: 1699000000000,
      identity: testIdentity
    }

    const encoded = serializeAuthorizationHeader(original)
    const decoded = authorizationHeaderCodec.dec(encoded)

    const authTypeString = new TextDecoder().decode(decoded.authorization_type)
    expect(authTypeString).toBe(original.authorizationType)

    const view = new DataView(new Uint8Array([0, 0, ...decoded.timestamp_id]).buffer)
    const reconstructedTimestamp = Number(view.getBigUint64(0, false))
    expect(reconstructedTimestamp).toBe(original.timestampId)

    expect(bytesToHex(decoded.identity)).toBe(original.identity.toLowerCase())
  })
})
