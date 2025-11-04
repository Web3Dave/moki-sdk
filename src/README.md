<p align="center">
    <a href="https://moki.chat">
        <picture>
            <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/Web3Dave/moki-sdk/main/.github/moki-sdk-white.svg">
            <img alt="moki logo" src="https://raw.githubusercontent.com/Web3Dave/moki-sdk/main/.github/moki-sdk-black.svg" width="auto" height="60">
        </picture>
    </a>
</p>
<p align="center">
  Fast, Light-weight, SDK for Web3 chat
</p>
<p align="center">
<a href="https://www.npmjs.com/package/@moki-chat/core">
 <img src="https://img.shields.io/npm/v/@moki-chat/core"/>
</a>
<a href="https://github.com/Web3Dave/moki-sdk/blob/main/LICENSE">
 <img src="https://img.shields.io/npm/l/@moki-chat/core"/>
</a>
<a href="https://github.com/Web3Dave/moki-sdk/issues">
 <img src="https://img.shields.io/github/issues/Web3Dave/moki-sdk"/>
</a>
<a href="https://bundlephobia.com/package/@moki-chat/core" >
 <img src="https://img.shields.io/bundlephobia/minzip/@moki-chat/core"/>
 </a>
<a href="https://codecov.io/github/Web3Dave/moki-sdk" >
 <img src="https://codecov.io/github/Web3Dave/moki-sdk/branch/main/graph/badge.svg?token=BP79W738ZH"/>
 </a>
<a href="https://github.com/Web3Dave/moki-sdk">
 <img src="https://img.shields.io/github/stars/Web3Dave/moki-sdk"/>
</a>
</p>

## Features

- **Lightweight & Fast** - Only 2.2 kB minified + compressed (brotli), or 10.6 kB compiled source (tree-shakeable)
- **End-to-End Encryption** - Secure messaging with AES-GCM encryption
- **EVM Wallet Native** - Built specifically for Ethereum-based wallets
- **No Browser Wallet Required** - Generate temporary wallets in localStorage for temporary visitors
- **Delegate Wallet Support** - Keep your main wallet safe, use a delegate for message signing
- **Simple Integration** - Easy to integrate into existing applications

## Overview

Moki SDK can be used with a localStorage key (for example: temporary web users)
```ts
// 1. Import modules.
import { privateKeyToMokiAccount } from '@moki/core/accounts'
import { createMessageClient } from '@moki/core/messaging'
import { createProvider } from '@moki/core/provider'

// 2. Set up your message client.
const provider = createProvider("https://moki-node.pingify.io");
const account = privateKeyToMokiAccount("0xe3F...") // Generate a temporary localStorage key here
const messageClient = createMessageClient(provider, {
            account,
            dangerouslyUseAccountAsDelegate: true
})

// 3. Send a message!
await messageClient.sendMessage(username, "Hello World!");
```

Browser wallet support coming soon...

## Try out the Example

The easiest way to currently test the message functionality of this SDK is by downloading the [Pingify app](https://pingify.io/download) and communicating directly with your Pingify @username using the [SDK Example Chat](https://web3dave.github.io/moki-sdk/)

## Documentation

Head over to [the docs](https://docs.moki.chat/sdk/getting-started) to get started and learn more about Moki.

