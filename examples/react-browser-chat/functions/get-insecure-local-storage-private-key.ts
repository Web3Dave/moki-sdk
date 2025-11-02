import { generatePrivateKey } from "viem/accounts";

export function getInsecureLocalStoragePrivateKey(): `0x${string}` {
    const storedPrivateKey = localStorage.getItem("insecurePrivateKey");

    if (storedPrivateKey) {
        return storedPrivateKey as `0x${string}`
    }

    const newPrivateKey = generatePrivateKey();
    localStorage.setItem("insecurePrivateKey", newPrivateKey);

    return newPrivateKey;
}