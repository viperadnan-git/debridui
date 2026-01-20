import { create } from "zustand";
import { queryClient } from "../query-client";
import { DebridClient } from "../clients";
import { useSelectionStore } from "./selection";
import { useUserStore } from "./users";

interface FileStoreState {
    sortBy: string;
    sortOrder: "asc" | "desc";
    setSortBy: (sortBy: string) => void;
    setSortOrder: (sortOrder: "asc" | "desc") => void;
    removeTorrent: (client: DebridClient, fileId: string) => Promise<string>;
    retryFiles: (client: DebridClient, fileIds: string[]) => Promise<Record<string, string>>;
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
    removeTorrent: async (client: DebridClient, fileId: string) => {
        const currentUser = useUserStore.getState().currentUser;
        const message = await client.removeTorrent(fileId);
        useSelectionStore.getState().removeFileSelection(fileId);
        queryClient.invalidateQueries({
            queryKey: [currentUser?.id, "getTorrentList"],
        });
        queryClient.invalidateQueries({
            queryKey: [currentUser?.id, "findTorrents"],
        });
        return message;
    },
    retryFiles: async (client: DebridClient, fileIds: string[]) => {
        const currentUser = useUserStore.getState().currentUser;
        const message = await client.restartTorrents(fileIds);
        queryClient.invalidateQueries({
            queryKey: [currentUser?.id, "getTorrentList"],
        });
        queryClient.invalidateQueries({
            queryKey: [currentUser?.id, "findTorrents"],
        });
        return message;
    },
}));
