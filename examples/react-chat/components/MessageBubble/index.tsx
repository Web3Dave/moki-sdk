import { MokiMessage } from "@moki-chat/core/types";
import styles from "./styles.module.css"
import { format } from "date-fns"

export function MessageBubble({ message, clientAddress }: { message: MokiMessage, clientAddress: `0x${string}` }) {
    const isSender = clientAddress.toLowerCase() === message.sender.toLowerCase();
    return <li className={[styles.messageBubbleContainer, isSender ? styles.messageSender : styles.messageRecipient].join(" ")}>
        <div className={[styles.messageBubble].join(" ")}>
            {message.payload.message}
        </div>
        <span className={styles.messageTimestamp}>
            {format(new Date(message.timestamp), "dd/MM - HH:mm")}
        </span>
    </li>
}