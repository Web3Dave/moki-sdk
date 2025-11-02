export type MokiRPCMessage = {
    id: `${number}`,
    receipt: `0x${string}`,
    signed_payload: `0x${string}`
}

export type MokiRPCChat = {
    data: MokiRPCMessage[];
    end: boolean
}

export type MokiMessagePayload = {
    code: number,
    recipient: `0x${string}`,
    message: string;
}

export type MokiMessage = {
    id: `${number}`,
    sender: `0x${string}`,
    receipt: `0x${string}`,
    timestamp: number,
    payload: MokiMessagePayload
}