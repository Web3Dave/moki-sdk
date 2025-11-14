import React, { createContext, useContext } from "react";
import { createMessageClient, MokiMessageClient } from "@moki-chat/core/messaging";
import { MokiAccount } from "@moki-chat/core/accounts";
import { MokiProvider } from "@moki-chat/core/provider";

interface MokiContextType {
    client: MokiMessageClient;
    account: MokiAccount;
    provider: MokiProvider
}

export const MokiContext = createContext<MokiContextType | null>(null);

export type MokiContextProps = { children: React.ReactNode, account: MokiAccount, provider: MokiProvider, primarySignerOnly?: boolean; }

export function MokiProvider({ children, account, provider, ...messageClientProps }: MokiContextProps) {

    const client = React.useMemo(() => (createMessageClient(provider, {
        account,
        dangerouslyUseAccountAsDelegate: true
    })), []);

    return <MokiContext.Provider value={{ client, account, provider } as MokiContextType}>
        {children}
    </MokiContext.Provider>
}