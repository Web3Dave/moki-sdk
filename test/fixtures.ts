import { privateKeyToMokiAccount } from '../src/accounts/privateKeyToMokiAccount'
import { MokiRPCIdentity } from '../src/types/identity'
import { CHAIN_ID, OP_CODE } from "../src/enum"
import { MokiAccount } from '../src/accounts/types'
import { compressPublicKey } from '../src/utils/compressPublicKey'
/**
 * Test account private keys (from Hardhat's default accounts)
 */
export const TEST_PRIVATE_KEYS = {
  ACCOUNT_1: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80' as const,
  ACCOUNT_2: '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d' as const,
  ACCOUNT_3: '0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a' as const,
  RPC_SERVICE: '0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6' as const,
} as const

/**
 * Pre-created test accounts
 */
export const TEST_ACCOUNTS = {
  ACCOUNT_1: privateKeyToMokiAccount(TEST_PRIVATE_KEYS.ACCOUNT_1),
  ACCOUNT_2: privateKeyToMokiAccount(TEST_PRIVATE_KEYS.ACCOUNT_2),
  ACCOUNT_3: privateKeyToMokiAccount(TEST_PRIVATE_KEYS.ACCOUNT_3),
  RPC_SERVICE: privateKeyToMokiAccount(TEST_PRIVATE_KEYS.RPC_SERVICE),
} as const

/**
 * Mock RPC URL for testing
 */
export const MOCK_RPC_URL = 'https://mock-node.moki.chat' as const

/**
 * Creates a mock MokiRPCIdentity for testing
 */
export async function createMockIdentity(username: string, identityAccount: MokiAccount, serviceAccount = TEST_ACCOUNTS.RPC_SERVICE): Promise<MokiRPCIdentity> {

  const payload = {
    chainId: CHAIN_ID.MAINNET,
    delegated_public_key: identityAccount.publicKey,
    nonce: 0,
    op_code: OP_CODE.CREATE_IDENTITY,
    service_identity: serviceAccount.address,
    username,
  } as const

  return {
    payload,
    public_key: compressPublicKey(identityAccount.publicKey),
    signature: "0x000000000" // Fake signature - not checked yet
  }
}