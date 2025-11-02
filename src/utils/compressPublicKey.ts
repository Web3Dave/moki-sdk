import { secp256k1 } from "@noble/curves/secp256k1";
import { bytesToHex } from "viem/utils";

export function compressPublicKey(uncompressedKey: `0x${string}`): `0x${string}` {
    const point = secp256k1.ProjectivePoint.fromHex(uncompressedKey.slice(2));
    return bytesToHex(point.toRawBytes(true));
}
