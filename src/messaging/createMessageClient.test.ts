import { describe, it, expect, vi } from 'vitest'
import { createMessageClient } from './createMessageClient'
import { privateKeyToMokiAccount } from '../accounts/privateKeyToMokiAccount'
import { MokiProvider } from '../provider/index'
import { MokiRPCMessage, MokiRPCChat } from '../types/message'
import { serializeMessageProof } from '../scale/serializeMessageProof'
import { bytesToHex } from 'viem'
import { publicKeyToAddress } from 'viem/utils'
import { encryptWithECDHSecret } from '../utils/crypto/encryptWithECDHSecret'
import { createMockIdentity, TEST_PRIVATE_KEYS } from '../../test/fixtures'
import { MOKI_RPC_METHODS } from '../enum'

describe('createMessageClient', () => {
  const accountPrivateKey = TEST_PRIVATE_KEYS.ACCOUNT_1
  const recipientPrivateKey = TEST_PRIVATE_KEYS.ACCOUNT_2

  const createMockProvider = (): MokiProvider => {
    return {
      request: vi.fn()
    } as unknown as MokiProvider
  }

  describe('initialization', () => {
    it('should throw error if neither delegateAccount nor dangerouslyUseAccountAsDelegate is provided', () => {
      const account = privateKeyToMokiAccount(accountPrivateKey)
      const provider = createMockProvider()

      expect(() =>
        createMessageClient(provider, { account })
      ).toThrow('options.delegateAccount must be defined. or enable dangerouslyUseAccountAsDelegate')
    })

    it('should create client with dangerouslyUseAccountAsDelegate option', () => {
      const account = privateKeyToMokiAccount(accountPrivateKey)
      const provider = createMockProvider()

      const client = createMessageClient(provider, {
        account,
        dangerouslyUseAccountAsDelegate: true
      })

      expect(client).toBeDefined()
      expect(client.sendMessage).toBeDefined()
      expect(client.getBlock).toBeDefined()
      expect(client.getIdentityFromAddress).toBeDefined()
      expect(client.getIdentityFromUsername).toBeDefined()
      expect(client.getLatestChat).toBeDefined()
      expect(client.watchChat).toBeDefined()
    })

    it('should create client with separate delegateAccount', () => {
      const account = privateKeyToMokiAccount(accountPrivateKey)
      const delegateAccount = privateKeyToMokiAccount(recipientPrivateKey)
      const provider = createMockProvider()

      const client = createMessageClient(provider, {
        account,
        delegateAccount
      })

      expect(client).toBeDefined()
    })
  })

  describe('getBlock', () => {
    it('should call provider with correct method', async () => {
      const account = privateKeyToMokiAccount(accountPrivateKey)
      const provider = createMockProvider()
      const mockBlock = '0x1234567890abcdef' as `0x${string}`

      vi.mocked(provider.request).mockResolvedValue(mockBlock)

      const client = createMessageClient(provider, {
        account,
        dangerouslyUseAccountAsDelegate: true
      })

      const block = await client.getBlock()

      expect(provider.request).toHaveBeenCalledWith({
        method: MOKI_RPC_METHODS.ETH_GET_BLOCK
      })
      expect(block).toBe(mockBlock)
    })
  })

  describe('getIdentityFromUsername', () => {
    it('should fetch identity from provider and cache it', async () => {
      const account = privateKeyToMokiAccount(accountPrivateKey)
      const provider = createMockProvider()
      const recipientAccount = privateKeyToMokiAccount(recipientPrivateKey)

      const mockIdentity = await createMockIdentity('testuser', recipientAccount)

      vi.mocked(provider.request).mockResolvedValue(mockIdentity)

      const client = createMessageClient(provider, {
        account,
        dangerouslyUseAccountAsDelegate: true
      })

      // First call - should fetch from provider
      const identity1 = await client.getIdentityFromUsername('testuser')
      expect(provider.request).toHaveBeenCalledWith({
        method: MOKI_RPC_METHODS.MOKI_GET_IDENTITY_BY_USERNAME,
        params: ['testuser']
      })
      expect(identity1).toEqual(mockIdentity)

      // Second call - should use cache
      const identity2 = await client.getIdentityFromUsername('testuser')
      expect(provider.request).toHaveBeenCalledTimes(1) // Not called again
      expect(identity2).toEqual(mockIdentity)
    })
  })

  describe('getIdentityFromAddress', () => {
    it('should fetch identity from provider and cache it', async () => {
      const account = privateKeyToMokiAccount(accountPrivateKey)
      const provider = createMockProvider()
      const recipientAccount = privateKeyToMokiAccount(recipientPrivateKey)

      const mockIdentity = await createMockIdentity('testuser', recipientAccount)

      vi.mocked(provider.request).mockResolvedValue(mockIdentity)

      const client = createMessageClient(provider, {
        account,
        dangerouslyUseAccountAsDelegate: true
      })

      const address = recipientAccount.address

      // First call
      const identity1 = await client.getIdentityFromAddress(address)
      expect(provider.request).toHaveBeenCalledWith({
        method: MOKI_RPC_METHODS.MOKI_GET_IDENTITY,
        params: [address]
      })
      expect(identity1).toEqual(mockIdentity)

      // Second call - should use cache
      const identity2 = await client.getIdentityFromAddress(address)
      expect(provider.request).toHaveBeenCalledTimes(1)
      expect(identity2).toEqual(mockIdentity)
    })
  })

  describe('sendMessage', () => {
    it('should encrypt, sign, and send a message', async () => {
      const senderAccount = privateKeyToMokiAccount(accountPrivateKey)
      const recipientAccount = privateKeyToMokiAccount(recipientPrivateKey)
      const provider = createMockProvider()

      const mockIdentity = await createMockIdentity('recipient', recipientAccount)

      const testMessage = 'Hello, Moki!'

      // Create a proper mock response message
      const recipientAddress = publicKeyToAddress(recipientAccount.publicKey)
      const ecdhSecret = await senderAccount.deriveECDHSecret(recipientAccount.publicKey)
      const encryptedMessage = await encryptWithECDHSecret(ecdhSecret, testMessage)
      const messageProof = serializeMessageProof({ message: encryptedMessage, recipient: recipientAddress })
      const signature = await senderAccount.signMessage({ message: { raw: messageProof } })
      const signedPayload = (bytesToHex(messageProof) + signature.replace('0x', '')) as `0x${string}`

      const mockResponse: MokiRPCMessage = {
        id: `${Date.now()}0000000000` as `${number}`,
        signed_payload: signedPayload,
        receipt: '0xreceipt123' as `0x${string}`
      }

      // Mock provider responses
      vi.mocked(provider.request)
        .mockResolvedValueOnce(mockIdentity) // getIdentityFromUsername
        .mockResolvedValueOnce(mockResponse)  // sendMessage

      const client = createMessageClient(provider, {
        account: senderAccount,
        dangerouslyUseAccountAsDelegate: true
      })

      const result = await client.sendMessage('recipient', testMessage)

      // Verify provider was called correctly
      expect(provider.request).toHaveBeenCalledWith({
        method: MOKI_RPC_METHODS.MOKI_GET_IDENTITY_BY_USERNAME,
        params: ['recipient']
      })

      expect(provider.request).toHaveBeenCalledWith({
        method: MOKI_RPC_METHODS.MOKI_SERVICE_SEND_MESSAGE,
        params: [expect.stringMatching(/^0x[0-9a-f]+$/)]
      })

      // Verify the result
      expect(result).toBeDefined()
      expect(result.payload.message).toBe(testMessage)
      expect(result.sender).toBe(senderAccount.address.toLowerCase())
    })
  })

  describe('getLatestChat', () => {
    it('should fetch and decrypt chat messages', async () => {
      const senderAccount = privateKeyToMokiAccount(accountPrivateKey)
      const recipientAccount = privateKeyToMokiAccount(recipientPrivateKey)
      const provider = createMockProvider()

      const mockIdentity = await createMockIdentity('chatuser', recipientAccount)

      // Create mock encrypted messages
      const testMessage1 = 'First message'
      const testMessage2 = 'Second message'

      const recipientAddress = publicKeyToAddress(recipientAccount.publicKey)
      const ecdhSecret = await senderAccount.deriveECDHSecret(recipientAccount.publicKey)

      const createMockMessage = async (text: string, timestamp: number): Promise<MokiRPCMessage> => {
        const encrypted = await encryptWithECDHSecret(ecdhSecret, text)
        const proof = serializeMessageProof({ message: encrypted, recipient: recipientAddress })
        const sig = await senderAccount.signMessage({ message: { raw: proof } })
        return {
          id: `${timestamp}0000000000` as `${number}`,
          signed_payload: (bytesToHex(proof) + sig.replace('0x', '')) as `0x${string}`,
          receipt: '0xreceipt' as `0x${string}`
        }
      }

      const mockChatResponse: MokiRPCChat = {
        data: [
          await createMockMessage(testMessage1, Date.now()),
          await createMockMessage(testMessage2, Date.now() + 1000)
        ],
        end: false
      }

      vi.mocked(provider.request)
        .mockResolvedValueOnce(mockIdentity) // getIdentityFromUsername
        .mockResolvedValueOnce(mockChatResponse) // getLatestChat

      const client = createMessageClient(provider, {
        account: senderAccount,
        dangerouslyUseAccountAsDelegate: true
      })

      const chat = await client.getLatestChat('chatuser')

      expect(chat).toBeDefined()
      expect(chat.data).toHaveLength(2)
      expect(chat.data[0].payload.message).toBe(testMessage1)
      expect(chat.data[1].payload.message).toBe(testMessage2)
      expect(chat.end).toBe(false)
    })
  })

  describe('watchChat', () => {
    it('should return a stop function', () => {
      const account = privateKeyToMokiAccount(accountPrivateKey)
      const provider = createMockProvider()

      const client = createMessageClient(provider, {
        account,
        dangerouslyUseAccountAsDelegate: true
      })

      const callback = vi.fn()
      const stopWatching = client.watchChat('watchuser', callback)

      expect(typeof stopWatching).toBe('function')

      // Clean up - stop watching immediately
      stopWatching()
    })

    it('should call stop function without errors', () => {
      const account = privateKeyToMokiAccount(accountPrivateKey)
      const provider = createMockProvider()

      const client = createMessageClient(provider, {
        account,
        dangerouslyUseAccountAsDelegate: true
      })

      const callback = vi.fn()
      const stopWatching = client.watchChat('watchuser', callback)

      // Should not throw
      expect(() => stopWatching()).not.toThrow()
    })
  })
})
