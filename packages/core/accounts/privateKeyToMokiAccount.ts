import { privateKeyToAccount } from "viem/accounts";
import { deriveECDHSecret } from "../utils/crypto/deriveECDHSecret";
import { MokiAccount } from "./types";

export function privateKeyToMokiAccount(privateKey: `0x${string}`): MokiAccount {
    const baseAccount = privateKeyToAccount(privateKey)

    return {
        address: baseAccount.address,
        signMessage: baseAccount.signMessage,
        publicKey: baseAccount.publicKey,
        deriveECDHSecret: (publicKey: `0x${string}`) => deriveECDHSecret(privateKey, publicKey)
    }
}