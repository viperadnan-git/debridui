import { QueryClient } from "@tanstack/react-query";
import { get, set, del } from "idb-keyval";
import { PersistedClient, Persister } from "@tanstack/react-query-persist-client";
import { QUERY_CACHE_STALE_TIME, QUERY_CACHE_GC_TIME, QUERY_CACHE_IDB_MAX_AGE } from "./constants";

function createIDBPersister(idbValidKey: IDBValidKey = "reactQuery") {
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
            gcTime: QUERY_CACHE_GC_TIME,
            staleTime: QUERY_CACHE_STALE_TIME,
        },
    },
});

const persister = createIDBPersister("DEBRIDUI_CACHE");
export const persistOptions = { persister, maxAge: QUERY_CACHE_IDB_MAX_AGE };
