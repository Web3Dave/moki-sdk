import { Bytes, Struct } from "scale-ts";

export const authorizationHeaderCodec = Struct({
    authorization_type: Bytes(),    // Vec<u8> for dynamic length UTF-8 value
    timestamp_id: Bytes(6),         // 6 bytes for big-endian timestamp
    identity: Bytes(20),            // 20 bytes for identity
});