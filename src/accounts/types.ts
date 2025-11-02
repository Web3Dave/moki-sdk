export type SignableMessage =
    | string
    | {
        /** Raw data representation of the message. */
        raw: `0x${string}` | Uint8Array
    }

export type MokiAccount = {
    address: `0x${string}`;
    publicKey: `0x${string}`;
    signMessage: (messageObject: { message: SignableMessage }) => Promise<`0x${string}`>
    deriveECDHSecret: (publicKey: `0x${string}`) => Promise<Uint8Array>
}