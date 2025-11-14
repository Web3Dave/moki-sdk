import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createProvider } from './createProvider'
import { MOKI_RPC_METHODS } from '../enum'
import { createMockIdentity, MOCK_RPC_URL, TEST_ACCOUNTS } from '../../../test/fixtures'

describe('createProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should create a provider with request method', () => {
    const provider = createProvider(MOCK_RPC_URL)

    expect(provider).toBeDefined()
    expect(provider.request).toBeInstanceOf(Function)
  })

  it('should make POST request with correct JSON-RPC format', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      json: async () => ({ jsonrpc: '2.0', id: 1, result: { block: "0x01" } }),
    })
    vi.stubGlobal('fetch', mockFetch)

    const provider = createProvider(MOCK_RPC_URL)
    await provider.request({
      method: MOKI_RPC_METHODS.ETH_GET_BLOCK,
      params: ["0x01"],
    })

    expect(mockFetch).toHaveBeenCalledWith(
      MOCK_RPC_URL,
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: MOKI_RPC_METHODS.ETH_GET_BLOCK,
          params: ["0x01"],
          id: 1,
        }),
      })
    )
  })

  it('should include authorization header when provided', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      json: async () => ({ jsonrpc: '2.0', id: 1, result: {} }),
    })
    vi.stubGlobal('fetch', mockFetch)

    const provider = createProvider(MOCK_RPC_URL)
    await provider.request({
      method: MOKI_RPC_METHODS.MOKI_SERVICE_SEND_MESSAGE,
      authorizationHeader: '0xabcd1234',
    })

    expect(mockFetch).toHaveBeenCalledWith(
      MOCK_RPC_URL,
      expect.objectContaining({
        headers: {
          'Content-Type': 'application/json',
          Authorization: '0xabcd1234',
        },
      })
    )
  })

  it('should return the result from JSON-RPC response', async () => {
    const mockResult = await createMockIdentity("test", TEST_ACCOUNTS.ACCOUNT_1)
    const mockFetch = vi.fn().mockResolvedValue({
      json: async () => ({ jsonrpc: '2.0', id: 1, result: mockResult }),
    })
    vi.stubGlobal('fetch', mockFetch)

    const provider = createProvider(MOCK_RPC_URL)
    const result = await provider.request({
      method: MOKI_RPC_METHODS.MOKI_GET_IDENTITY,
      params: ['0x123'],
    })

    expect(result).toEqual(mockResult)
  })

  it('should throw error when JSON-RPC returns error', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      json: async () => ({
        jsonrpc: '2.0',
        id: 1,
        error: { code: -32600, message: 'Invalid request' },
      }),
    })
    vi.stubGlobal('fetch', mockFetch)

    const provider = createProvider(MOCK_RPC_URL)

    await expect(
      provider.request({
        method: MOKI_RPC_METHODS.ETH_GET_BLOCK,
      })
    ).rejects.toThrow('Invalid request')
  })

  it('should use empty array as default params', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      json: async () => ({ jsonrpc: '2.0', id: 1, result: {} }),
    })
    vi.stubGlobal('fetch', mockFetch)

    const provider = createProvider(MOCK_RPC_URL)
    await provider.request({
      method: MOKI_RPC_METHODS.ETH_GET_BLOCK,
    })

    expect(mockFetch).toHaveBeenCalledWith(
      MOCK_RPC_URL,
      expect.objectContaining({
        body: expect.stringContaining('"params":[]'),
      })
    )
  })
})
