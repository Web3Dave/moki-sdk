import { MokiAccount } from "@moki-chat/core";
import { useContext } from "react";
import { MokiContext } from "../context";

export const useMokiAccount = (): MokiAccount => {
    const ctx = useContext(MokiContext);
    if (!ctx) throw new Error("Must be used inside <MokiProvider>")
    return ctx.account
}