
export interface MokiProvider {
    request<T = unknown>(args: {
        method: MokiRpcMethods
        params?: unknown[],
        authorizationHeader?: `0x${string}`
    }): Promise<T>
}

export enum MokiRpcMethods {
    ETH_GET_BLOCK = "eth_getBlock",
    MOKI_GET_IDENTITY = "moki_getIdentity",
    MOKI_GET_IDENTITY_BY_USERNAME = "moki_getIdentityByUsername",
    MOKI_SERVICE_SEND_MESSAGE = "mokiService_sendMessage",
    MOKI_SERVICE_GET_CHAT = "mokiService_getChat"
}

export function createProvider(rpcUrl: string): MokiProvider {
    return {
        async request({ method, params = [], authorizationHeader }) {
            const headers: HeadersInit = {
                'Content-Type': 'application/json',
            };

            if (authorizationHeader) {
                headers.Authorization = authorizationHeader;
            }

            const response = await fetch(rpcUrl, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    method,
                    params,
                    id: 1,
                }),
            })

            const data = await response.json()

            if (data.error) throw new Error(data.error.message)

            return data.result
        },
    }
}