import { removeInsecureLocalStoragePrivateKey } from "../../functions/remove-insecure-local-storage-private-key";
import styles from "./styles.module.css"
import { LuRefreshCw } from "react-icons/lu";

export function TemporaryAccount({ address }: { address: `0x${string}` }) {
    const onRefreshLocalStorageAccount = () => {
        removeInsecureLocalStoragePrivateKey();
        window.location.reload()
    }
    return <button onClick={onRefreshLocalStorageAccount} className={styles.toggleButton}>{address.slice(0, 4)}...{address.slice(-3)}<LuRefreshCw size={22} color={"black"} /></button>
}