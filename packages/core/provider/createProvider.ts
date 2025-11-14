import { MOKI_RPC_METHODS } from "../enum";

export interface MokiProvider {
    request<T = unknown>(args: {
        method: MOKI_RPC_METHODS
        params?: unknown[],
        authorizationHeader?: `0x${string}`
    }): Promise<T>
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