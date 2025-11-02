export type MokiRPCIdentityPayload = {
    chainId: 6654,
    delegated_public_key: `0x${string}`,
    nonce: number,
    op_code: 1,
    service_identity: `0x${string}`,
    username: string
}

export type MokiRPCIdentity = {
    payload: MokiRPCIdentityPayload,
    public_key: `0x${string}`,
    signature: `0x${string}`
}