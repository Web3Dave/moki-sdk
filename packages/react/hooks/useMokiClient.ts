import { MokiMessageClient } from "@moki-chat/core";
import { useContext } from "react";
import { MokiContext } from "../context";

export const useMokiClient = (): MokiMessageClient => {
    const ctx = useContext(MokiContext);
    if (!ctx) throw new Error("Must be used inside <MokiProvider>")
    return ctx.client
}