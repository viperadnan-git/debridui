import { DebridFile } from "@/lib/types";
import { create } from "zustand";
import { queryClient } from "../query-client";
import { DebridClient } from "../clients";
import { useSelectionStore } from "./selection";
import { sortTorrentFiles } from "../utils/file";
import { useUserStore } from "./users";

interface FileStoreState {
    files: DebridFile[];
    currentPage: number;
    totalCount: number | null;
    sortBy: string;
    sortOrder: "asc" | "desc";
    sortChanged: boolean;
    setFiles: (files: DebridFile[]) => void;
    setCurrentPage: (page: number) => void;
    setTotalCount: (count: number | null) => void;
    removeFile: (fileId: string) => void;
    sortAndSetFiles: (files: DebridFile[]) => void;
    setSortBy: (sortBy: string) => void;
    setSortOrder: (sortOrder: "asc" | "desc") => void;
    removeTorrent: (client: DebridClient, fileId: string) => Promise<string>;
    retryFiles: (client: DebridClient, fileIds: string[]) => Promise<Record<string, string>>;
}

const initialState = {
    files: [],
    currentPage: 1,
    totalCount: null as number | null,
    sortBy: "date",
    sortOrder: "desc" as const,
    sortChanged: false,
};

export const useFileStore = create<FileStoreState>((set, get) => ({
    ...initialState,
    setFiles: (files: DebridFile[]) => {
        get().sortAndSetFiles(files);
    },
    setCurrentPage: (page: number) => {
        set({ currentPage: page });
    },
    setTotalCount: (count: number | null) => {
        set({ totalCount: count });
    },
    removeFile: (fileId: string) => {
        set((state) => ({
            files: state.files.filter((f) => f.id !== fileId),
        }));
    },
    sortAndSetFiles: (files: DebridFile[]) => {
        const { sortBy, sortOrder, sortChanged } = get();
        if (sortBy === "date" && sortOrder === "desc" && !sortChanged) {
            set({ files });
            return;
        }
        const sortedFiles = sortTorrentFiles(files, sortBy, sortOrder);
        set({
            files: sortedFiles,
            sortChanged: sortBy !== "date" || sortOrder !== "desc",
        });
    },
    setSortBy: (sortBy: string) => {
        set({ sortBy });
        get().sortAndSetFiles(get().files);
    },
    setSortOrder: (sortOrder: "asc" | "desc") => {
        set({ sortOrder });
        get().sortAndSetFiles(get().files);
    },
    removeTorrent: async (client: DebridClient, fileId: string) => {
        const currentUser = useUserStore.getState().currentUser;
        const message = await client.removeTorrent(fileId);
        get().removeFile(fileId);
        // Clear selection for this file
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
