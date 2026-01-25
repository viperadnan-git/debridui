import { create } from "zustand";
import { queryClient } from "../query-client";
import { DebridClient } from "../clients";
import { useSelectionStore } from "./selection";

interface FileStoreState {
    sortBy: string;
    sortOrder: "asc" | "desc";
    setSortBy: (sortBy: string) => void;
    setSortOrder: (sortOrder: "asc" | "desc") => void;
    removeTorrent: (client: DebridClient, accountId: string, fileId: string) => Promise<string>;
    retryFiles: (client: DebridClient, accountId: string, fileIds: string[]) => Promise<Record<string, string>>;
}

const initialState = {
    sortBy: "date",
    sortOrder: "desc" as const,
};

export const useFileStore = create<FileStoreState>((set) => ({
    ...initialState,
    setSortBy: (sortBy: string) => {
        set({ sortBy });
    },
    setSortOrder: (sortOrder: "asc" | "desc") => {
        set({ sortOrder });
    },
    removeTorrent: async (client: DebridClient, accountId: string, fileId: string) => {
        const message = await client.removeTorrent(fileId);
        useSelectionStore.getState().removeFileSelection(fileId);
        queryClient.invalidateQueries({
            queryKey: [accountId, "getTorrentList"],
        });
        queryClient.invalidateQueries({
            queryKey: [accountId, "findTorrents"],
        });
        return message;
    },
    retryFiles: async (client: DebridClient, accountId: string, fileIds: string[]) => {
        const message = await client.restartTorrents(fileIds);
        queryClient.invalidateQueries({
            queryKey: [accountId, "getTorrentList"],
        });
        queryClient.invalidateQueries({
            queryKey: [accountId, "findTorrents"],
        });
        return message;
    },
}));
