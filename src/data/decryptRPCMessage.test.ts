import { describe, it, expect } from 'vitest'
import { decryptRPCMessage } from './decryptRPCMessage'
import { privateKeyToMokiAccount } from '../accounts/privateKeyToMokiAccount'
import { encryptWithECDHSecret } from '../utils/crypto/encryptWithECDHSecret'
import { serializeMessageProof } from '../scale/serializeMessageProof'
import { bytesToHex, hexToBytes } from 'viem'
import { publicKeyToAddress } from 'viem/utils'
import { TEST_PRIVATE_KEYS } from '../../test/fixtures'

describe('decryptRPCMessage', () => {
  const senderPrivateKey = TEST_PRIVATE_KEYS.ACCOUNT_1
  const recipientPrivateKey = TEST_PRIVATE_KEYS.ACCOUNT_2

  it('should decrypt and verify a valid RPC message', async () => {
    // Setup: Create sender and recipient accounts
    const senderAccount = privateKeyToMokiAccount(senderPrivateKey)
    const recipientAccount = privateKeyToMokiAccount(recipientPrivateKey)

    // Create a test message
    const testMessage = 'Hello from Moki SDK test!'
    const recipientAddress = publicKeyToAddress(recipientAccount.publicKey)

    // Encrypt the message using ECDH
    const ecdhSecret = await senderAccount.deriveECDHSecret(recipientAccount.publicKey)
    const encryptedMessage = await encryptWithECDHSecret(ecdhSecret, testMessage)

    // Serialize message proof (this is what gets signed)
    const messageProof = serializeMessageProof({
      message: encryptedMessage,
      recipient: recipientAddress
    })

    // Sign the message
    const signature = await senderAccount.signMessage({ message: { raw: messageProof } })

    // Create the signed_payload (messageProof + signature)
    const signedPayload = (bytesToHex(messageProof) + signature.replace('0x', '')) as `0x${string}`

    // Create RPC message structure
    const timestamp = Date.now()
    const messageId = `${timestamp}${'0'.repeat(10)}` as `${number}`
    const receipt = '0xreceipt123' as `0x${string}`

    const rpcMessage = {
      id: messageId,
      signed_payload: signedPayload,
      receipt
    }

    // Test: Decrypt the message
    const decryptedMessage = await decryptRPCMessage(ecdhSecret, rpcMessage)

    // Assertions
    expect(decryptedMessage).toBeDefined()
    expect(decryptedMessage.id).toBe(messageId)
    expect(decryptedMessage.sender).toBe(senderAccount.address.toLowerCase())
    expect(decryptedMessage.receipt).toBe(receipt)
    expect(decryptedMessage.timestamp).toBe(timestamp)
    expect(decryptedMessage.payload).toBeDefined()
    expect(decryptedMessage.payload.message).toBe(testMessage)
    expect(decryptedMessage.payload.recipient).toBe(recipientAddress.toLowerCase())
    expect(decryptedMessage.payload.code).toBe(0)
  })

  it('should extract correct timestamp from message id', async () => {
    const senderAccount = privateKeyToMokiAccount(senderPrivateKey)
    const recipientAccount = privateKeyToMokiAccount(recipientPrivateKey)

    const testMessage = 'Test timestamp'
    const recipientAddress = publicKeyToAddress(recipientAccount.publicKey)
    const ecdhSecret = await senderAccount.deriveECDHSecret(recipientAccount.publicKey)
    const encryptedMessage = await encryptWithECDHSecret(ecdhSecret, testMessage)
    const messageProof = serializeMessageProof({ message: encryptedMessage, recipient: recipientAddress })
    const signature = await senderAccount.signMessage({ message: { raw: messageProof } })
    const signedPayload = (bytesToHex(messageProof) + signature.replace('0x', '')) as `0x${string}`

    const expectedTimestamp = 1699000000000
    const messageId = `${expectedTimestamp}0123456789` as `${number}`

    const rpcMessage = {
      id: messageId,
      signed_payload: signedPayload,
      receipt: '0xreceipt' as `0x${string}`
    }

    const decryptedMessage = await decryptRPCMessage(ecdhSecret, rpcMessage)

    expect(decryptedMessage.timestamp).toBe(expectedTimestamp)
  })

  it('should recover correct sender address from signature', async () => {
    const senderAccount = privateKeyToMokiAccount(senderPrivateKey)
    const recipientAccount = privateKeyToMokiAccount(recipientPrivateKey)

    const testMessage = 'Verify sender'
    const recipientAddress = publicKeyToAddress(recipientAccount.publicKey)
    const ecdhSecret = await senderAccount.deriveECDHSecret(recipientAccount.publicKey)
    const encryptedMessage = await encryptWithECDHSecret(ecdhSecret, testMessage)
    const messageProof = serializeMessageProof({ message: encryptedMessage, recipient: recipientAddress })
    const signature = await senderAccount.signMessage({ message: { raw: messageProof } })
    const signedPayload = (bytesToHex(messageProof) + signature.replace('0x', '')) as `0x${string}`

    const rpcMessage = {
      id: `${Date.now()}0000000000` as `${number}`,
      signed_payload: signedPayload,
      receipt: '0xreceipt' as `0x${string}`
    }

    const decryptedMessage = await decryptRPCMessage(ecdhSecret, rpcMessage)

    expect(decryptedMessage.sender).toBe(senderAccount.address.toLowerCase())
  })

  it('should handle decryption failure gracefully', async () => {
    const senderAccount = privateKeyToMokiAccount(senderPrivateKey)
    const recipientAccount = privateKeyToMokiAccount(recipientPrivateKey)

    // Create a different ECDH secret (wrong key)
    const wrongAccount = privateKeyToMokiAccount(TEST_PRIVATE_KEYS.ACCOUNT_3)
    const wrongSecret = await wrongAccount.deriveECDHSecret(recipientAccount.publicKey)

    const testMessage = 'This will fail to decrypt'
    const recipientAddress = publicKeyToAddress(recipientAccount.publicKey)
    const correctSecret = await senderAccount.deriveECDHSecret(recipientAccount.publicKey)
    const encryptedMessage = await encryptWithECDHSecret(correctSecret, testMessage)
    const messageProof = serializeMessageProof({ message: encryptedMessage, recipient: recipientAddress })
    const signature = await senderAccount.signMessage({ message: { raw: messageProof } })
    const signedPayload = (bytesToHex(messageProof) + signature.replace('0x', '')) as `0x${string}`

    const rpcMessage = {
      id: `${Date.now()}0000000000` as `${number}`,
      signed_payload: signedPayload,
      receipt: '0xreceipt' as `0x${string}`
    }

    // Should not throw, but message should be empty due to decryption failure
    const decryptedMessage = await decryptRPCMessage(wrongSecret, rpcMessage)

    expect(decryptedMessage).toBeDefined()
    expect(decryptedMessage.payload.message).toBe('') // Failed decryption results in empty string
  })

  it('should throw error for unsupported message type', async () => {
    const senderAccount = privateKeyToMokiAccount(senderPrivateKey)
    const recipientAccount = privateKeyToMokiAccount(recipientPrivateKey)

    const ecdhSecret = await senderAccount.deriveECDHSecret(recipientAccount.publicKey)

    // Create a message with type "01" (unsupported) but properly signed
    const testMessage = 'Test unsupported type'
    const recipientAddress = publicKeyToAddress(recipientAccount.publicKey)
    const encryptedMessage = await encryptWithECDHSecret(ecdhSecret, testMessage)
    const messageProof = serializeMessageProof({ message: encryptedMessage, recipient: recipientAddress })

    // Manually change the type byte from "00" to "01"
    const messageProofHex = bytesToHex(messageProof).replace('0x', '')
    const modifiedPayload = '01' + messageProofHex.slice(2) // Replace first byte with "01"

    // Sign the modified payload
    const modifiedProofBytes = hexToBytes(`0x${modifiedPayload}`)
    const signature = await senderAccount.signMessage({ message: { raw: modifiedProofBytes } })
    const signedPayload = ('0x' + modifiedPayload + signature.replace('0x', '')) as `0x${string}`

    const rpcMessage = {
      id: `${Date.now()}0000000000` as `${number}`,
      signed_payload: signedPayload,
      receipt: '0xreceipt' as `0x${string}`
    }

    await expect(decryptRPCMessage(ecdhSecret, rpcMessage)).rejects.toThrow("Unsupported message type '01'")
  })
})
