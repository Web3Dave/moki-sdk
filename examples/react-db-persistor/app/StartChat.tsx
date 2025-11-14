"use client"

import { useState } from "react"
import styles from "./styles.module.css"
import Link from "next/link"

export function StartChat() {
    const [username, setUsername] = useState("")
    return <main className={styles.main}>
        <h1 className={styles.title}>Select Chat</h1>
        <div className={styles.notice}>
            <p>
                This version of Moki SDK is still in development, to test two-way messaging in this example:
            </p>
            <ol>
                <li>
                    Create a user with the Pingify App <a target="_blank_" href={"https://pingify.io/download"}>(Download here)</a>.
                </li>
                <li>
                    Enter your username to start a chat using the moki-sdk.
                </li>
            </ol>
            <p>
                The browser client is randomly generated and stored in localstorage. You can generate a new one in top right corner of a chat.
            </p>
        </div>
        <div className={styles.inputContainer}>
            <input className={styles.input} placeholder={"e.g. pingify"} value={username} onChange={(ev) => { setUsername(ev.target.value) }}></input>
        </div>
        <Link href={`/chat?username=${username}`} aria-disabled={username === ""} className={styles.button}>Chat with @{username}</Link>
    </main>
}