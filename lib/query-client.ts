import { QueryClient } from "@tanstack/react-query";
import { persistQueryClient } from "@tanstack/react-query-persist-client";

import { get, set, del } from "idb-keyval";
import { PersistedClient, Persister } from "@tanstack/react-query-persist-client";

export function createIDBPersister(idbValidKey: IDBValidKey = "reactQuery") {
    return {
        persistClient: async (client: PersistedClient) => {
            await set(idbValidKey, client);
        },
        restoreClient: async () => {
            return await get<PersistedClient>(idbValidKey);
        },
        removeClient: async () => {
            await del(idbValidKey);
        },
    } satisfies Persister;
}

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            // Global defaults - can be overridden per query
            gcTime: 1000 * 60 * 60 * 24, // 24 hours
            staleTime: 1000 * 60 * 5, // 5 minutes default
        },
    },
});

export const initializeQueryClientPersistence = () => {
    if (typeof window !== "undefined") {
        persistQueryClient({
            queryClient,
            persister: createIDBPersister("DEBRIDUI_CACHE"),
            maxAge: 1000 * 60 * 60 * 24, // 24 hours
        });
    }
};
