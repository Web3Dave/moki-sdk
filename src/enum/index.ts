export enum OP_CODE {
    CREATE_IDENTITY = 1
}

export enum CHAIN_ID {
    MAINNET = 6654
}

export enum MOKI_RPC_METHODS {
    ETH_GET_BLOCK = "eth_getBlock",
    MOKI_GET_IDENTITY = "moki_getIdentity",
    MOKI_GET_IDENTITY_BY_USERNAME = "moki_getIdentityByUsername",
    MOKI_SERVICE_SEND_MESSAGE = "mokiService_sendMessage",
    MOKI_SERVICE_GET_CHAT = "mokiService_getChat"
}