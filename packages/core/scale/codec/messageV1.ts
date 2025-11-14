import { Bytes, Struct, u8 } from "scale-ts";

// Define the SCALE codec for MokiSendMessageV1
export const messageV1Codec = Struct({
    code: u8,
    recipient: Bytes(20),           // 20 bytes for recipient identity
    message: Bytes(),               // Vec<u8> for encrypted message payload
});