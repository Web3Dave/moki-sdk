import { secp256k1 } from "@noble/curves/secp256k1";
import { bytesToHex } from "viem/utils";

export function decompressPublicKey(compressedKey: `0x${string}`): `0x${string}` {
    const point = secp256k1.ProjectivePoint.fromHex(compressedKey.slice(2));
    return bytesToHex(point.toRawBytes(false));
}