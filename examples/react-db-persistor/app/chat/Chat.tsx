"use client";

import styles from "./styles.module.css"
import { MokiMessage } from '@moki-chat/core/types';
import { useEffect, useState } from 'react';
import { MessageBubble } from '../../components/MessageBubble';
import { FaChevronLeft } from "react-icons/fa";
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { TemporaryAccount } from '../../components/TemporaryAccount';
import { useSearchParams } from 'next/navigation';
import { useMokiClient, useMokiAccount } from "@moki-chat/react"

// const provider = createProvider("https://moki-node.pingify.io")

function ChatPage() {
    const searchParams = useSearchParams()
    const username = searchParams.get("username")
    const [messages, setMessages] = useState<MokiMessage[]>([]);
    const [inputMessage, setInputMessage] = useState("");
    const [error, setError] = useState<undefined | string>();
    const [loading, setLoading] = useState(true);
    const mokiClient = useMokiClient()
    const mokiAccount = useMokiAccount()

    const disableSend = error !== undefined && loading === false;

    // // When using localStorage you can't load it during SSR or SSG
    // const [account, messageClient] = useMemo(() => {
    //     const account = privateKeyToMokiAccount(getInsecureLocalStoragePrivateKey())

    //     const messageClient = createMessageClient(provider, {
    //         account,
    //         dangerouslyUseAccountAsDelegate: true
    //     })
    //     return [account, messageClient]
    // }, [])

    useEffect(() => {
        let unsubscribe: (() => void) | undefined;

        mokiClient.getLatestChat(username)
            .then((latestChat) => {
                const cleanMessages = latestChat.data.map(message => {
                    message.payload.message = message.payload.message.replace(/\[[,a-zA-Z]*\]/g, '');
                    return message;
                })
                setMessages(cleanMessages);
                setLoading(false);

                // Begin watching if getLatestChat succeeds
                unsubscribe = mokiClient.watchChat(username, (newMessages) => {
                    setMessages((previousMessages) => {
                        const cleanMessages = newMessages.filter(message =>
                            previousMessages.findIndex(currentMessage => currentMessage.id === message.id) === -1
                        ).map(message => {
                            message.payload.message = message.payload.message.replace(/\[[,a-zA-Z]*\]/g, '');
                            return message;
                        })
                        return [...cleanMessages, ...previousMessages]
                    })
                });
            })
            .catch(er => {
                setError(er.toString());
                setLoading(false);
            });

        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, [username]);

    const handleOnSendMessage = async () => {
        const sentMessage = await mokiClient.sendMessage(username, inputMessage);
        setInputMessage("")
        setMessages((previousMessages) => {
            return [sentMessage, ...previousMessages]
        })
    }

    return <main className={styles.chat}>
        <div className={styles.topBar}>
            <Link href="/" className={styles.backButton}><FaChevronLeft color={"black"} size={22} /></Link>
            <div className={styles.username}>@{username}</div>
            {/* <div className={styles.tempAddress}>{account.address.slice(0, 5)}...{account.address.slice(-3)}</div> */}
            <TemporaryAccount address={mokiAccount.address} />
        </div>
        {loading || error ? <div className={styles.messageInfo}>{loading ? "Loading..." : error}</div> : messages.length === 0 ? <div className={styles.messageInfo}>Send a message to @{username}</div> : <ul className={styles.messageList}>
            {messages.map((message) => <MessageBubble message={message} clientAddress={mokiAccount.address} key={message.id} />)}
        </ul>}
        <div className={styles.messageInputBar}>
            <input className={styles.messageInput} value={inputMessage} onChange={(ev) => { setInputMessage(ev.target.value) }} onKeyDown={disableSend ? undefined : (ev) => { if (ev.key === 'Enter') handleOnSendMessage() }}></input>
            <button className={styles.messageInputButton} onClick={handleOnSendMessage} aria-disabled={disableSend}>SEND</button>
        </div>
    </main>
}

export default dynamic(() => Promise.resolve(ChatPage), {
    ssr: false
})