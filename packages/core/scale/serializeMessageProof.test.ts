import { describe, it, expect } from 'vitest'
import { serializeMessageProof, mokiSendMessageV1Codec } from './serializeMessageProof'
import { bytesToHex, stringToHex } from 'viem'
import { TEST_ACCOUNTS } from '../../../test/fixtures'

describe('serializeMessageProof', () => {
  const testRecipient = TEST_ACCOUNTS.ACCOUNT_1.address
  const testMessage = stringToHex('Hello World')

  it('should serialize message proof', () => {
    const result = serializeMessageProof({
      message: testMessage,
      recipient: testRecipient
    })

    expect(result).toBeInstanceOf(Uint8Array)
    expect(result.length).toBeGreaterThan(0)
  })

  it('should encode code as 0', () => {
    const result = serializeMessageProof({
      message: testMessage,
      recipient: testRecipient
    })

    const decoded = mokiSendMessageV1Codec.dec(result)

    expect(decoded.code).toBe(0)
  })

  it('should encode recipient as 20 bytes', () => {
    const result = serializeMessageProof({
      message: testMessage,
      recipient: testRecipient
    })

    const decoded = mokiSendMessageV1Codec.dec(result)

    expect(decoded.recipient).toBeInstanceOf(Uint8Array)
    expect(decoded.recipient.length).toBe(20)
    expect(bytesToHex(decoded.recipient)).toBe(testRecipient.toLowerCase())
  })

  it('should encode message as bytes', () => {
    const result = serializeMessageProof({
      message: testMessage,
      recipient: testRecipient
    })

    const decoded = mokiSendMessageV1Codec.dec(result)

    expect(decoded.message).toBeInstanceOf(Uint8Array)
    expect(bytesToHex(decoded.message)).toBe(testMessage.toLowerCase())
  })

  it('should throw error for invalid recipient address length', () => {
    const invalidRecipient = '0x123' as `0x${string}` // Too short

    expect(() => {
      serializeMessageProof({
        message: testMessage,
        recipient: invalidRecipient
      })
    }).toThrow('Invalid recipient address length')
  })

  it('should handle different message lengths', () => {
    const messages = [
      stringToHex('A'),
      stringToHex('Hello'),
      stringToHex('This is a longer message to test encoding'),
    ]

    messages.forEach((messageHex) => {
      const result = serializeMessageProof({
        message: messageHex,
        recipient: testRecipient
      })

      const decoded = mokiSendMessageV1Codec.dec(result)
      expect(bytesToHex(decoded.message)).toBe(messageHex.toLowerCase())
    })
  })

  it('should handle empty message', () => {
    const emptyMessage = '0x' as `0x${string}`

    const result = serializeMessageProof({
      message: emptyMessage,
      recipient: testRecipient
    })

    const decoded = mokiSendMessageV1Codec.dec(result)
    expect(decoded.message.length).toBe(0)
    expect(bytesToHex(decoded.message)).toBe('0x')
  })

  it('should produce deterministic output for same inputs', () => {
    const params = {
      message: testMessage,
      recipient: testRecipient
    }

    const result1 = serializeMessageProof(params)
    const result2 = serializeMessageProof(params)

    expect(bytesToHex(result1)).toBe(bytesToHex(result2))
  })

  it('should produce different output for different recipients', () => {
    const recipient1 = TEST_ACCOUNTS.ACCOUNT_1.address
    const recipient2 = TEST_ACCOUNTS.ACCOUNT_2.address

    const result1 = serializeMessageProof({
      message: testMessage,
      recipient: recipient1
    })

    const result2 = serializeMessageProof({
      message: testMessage,
      recipient: recipient2
    })

    expect(bytesToHex(result1)).not.toBe(bytesToHex(result2))
  })

  it('should produce different output for different messages', () => {
    const message1 = stringToHex('Hello')
    const message2 = stringToHex('World')

    const result1 = serializeMessageProof({
      message: message1,
      recipient: testRecipient
    })

    const result2 = serializeMessageProof({
      message: message2,
      recipient: testRecipient
    })

    expect(bytesToHex(result1)).not.toBe(bytesToHex(result2))
  })

  it('should be reversible through decode', () => {
    const original = {
      message: testMessage,
      recipient: testRecipient
    }

    const encoded = serializeMessageProof(original)
    const decoded = mokiSendMessageV1Codec.dec(encoded)

    expect(decoded.code).toBe(0)
    expect(bytesToHex(decoded.recipient)).toBe(original.recipient.toLowerCase())
    expect(bytesToHex(decoded.message)).toBe(original.message.toLowerCase())
  })

  it('should handle all valid Ethereum addresses', () => {
    const recipients = [
      TEST_ACCOUNTS.ACCOUNT_1.address,
      TEST_ACCOUNTS.ACCOUNT_2.address,
      TEST_ACCOUNTS.ACCOUNT_3.address,
      TEST_ACCOUNTS.RPC_SERVICE.address,
    ]

    recipients.forEach(recipient => {
      const result = serializeMessageProof({
        message: testMessage,
        recipient
      })

      const decoded = mokiSendMessageV1Codec.dec(result)
      expect(bytesToHex(decoded.recipient)).toBe(recipient.toLowerCase())
    })
  })

  it('should handle large messages', () => {
    // Create a large message (1KB of text)
    const largeText = 'Lorem ipsum dolor sit amet. '.repeat(36) // ~1KB
    const largeMessage = stringToHex(largeText)

    const result = serializeMessageProof({
      message: largeMessage,
      recipient: testRecipient
    })

    const decoded = mokiSendMessageV1Codec.dec(result)
    expect(bytesToHex(decoded.message)).toBe(largeMessage.toLowerCase())
  })

  it('should handle special characters in messages', () => {
    const specialMessages = [
      'Hello 世界', // Unicode
      'Test @#$%^&*()', // Special chars
      'Line1\nLine2\nLine3', // Newlines
      '{"json": "data"}', // JSON
    ]

    specialMessages.forEach(text => {
      const hexMessage = stringToHex(text)
      const result = serializeMessageProof({
        message: hexMessage,
        recipient: testRecipient
      })

      const decoded = mokiSendMessageV1Codec.dec(result)
      expect(bytesToHex(decoded.message)).toBe(hexMessage.toLowerCase())
    })
  })
})
