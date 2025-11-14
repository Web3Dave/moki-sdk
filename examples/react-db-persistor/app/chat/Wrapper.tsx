"use client";

import { MokiProvider } from "@moki-chat/react";
import Chat from "./Chat";
import dynamic from "next/dynamic";
import { createProvider, privateKeyToMokiAccount } from "@moki-chat/core";
import { getInsecureLocalStoragePrivateKey } from "../../functions/get-insecure-local-storage-private-key";
import { useMemo } from "react";

const provider = createProvider("https://moki-node.pingify.io")

export function Wrapper() {
    const account = useMemo(() => {
        const account = privateKeyToMokiAccount(getInsecureLocalStoragePrivateKey())
        return account
    }, [])
    return <MokiProvider account={account} provider={provider}>
        <Chat />
    </MokiProvider>
}

export default dynamic(() => Promise.resolve(Wrapper), {
    ssr: false
})