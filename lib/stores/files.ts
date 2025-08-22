import { DebridFile } from "@/lib/types";
import { create } from "zustand";
import { PAGE_SIZE } from "../constants";
import { queryClient } from "../query-client";
import AllDebridClient from "../clients/alldebrid";
import { useSelectionStore } from "./selection";
import { sortTorrentFiles } from "../utils/file";
import { useUserStore } from "./users";

interface FileStoreState {
    files: DebridFile[];
    offset: number;
    hasMore: boolean;
    sortBy: string;
    sortOrder: "asc" | "desc";
    sortChanged: boolean;
    addFiles: (files: DebridFile[]) => void;
    removeFile: (fileId: string) => void;
    sortAndSetFiles: (files: DebridFile[]) => void;
    setOffset: (offset: number) => void;
    setSortBy: (sortBy: string) => void;
    setSortOrder: (sortOrder: "asc" | "desc") => void;
    removeTorrent: (client: AllDebridClient, fileId: string) => Promise<string>;
    retryFiles: (client: AllDebridClient, fileIds: string[]) => Promise<Record<string, string>>;
    loadFiles: () => DebridFile[];
}

const initialState = {
    files: [],
    offset: 0,
    hasMore: true,
    sortBy: "date",
    sortOrder: "desc" as const,
    sortChanged: false,
};

export const useFileStore = create<FileStoreState>((set, get) => ({
    ...initialState,
    addFiles: (files: DebridFile[]) => {
        const { offset } = get();
        if (offset === 0) {
            get().sortAndSetFiles(files);
        } else {
            const existingIds = new Set(get().files.map((f) => f.id));
            const newFiles = files.filter((f) => !existingIds.has(f.id));
            if (newFiles.length > 0) {
                set((state) => ({
                    files: [...state.files, ...newFiles],
                    hasMore: files.length === PAGE_SIZE + offset,
                }));
                get().sortAndSetFiles(files);
            }
        }
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
    setOffset: (offset: number) => {
        set({ offset });
    },
    setSortBy: (sortBy: string) => {
        set({ sortBy });
        get().sortAndSetFiles(get().files);
    },
    setSortOrder: (sortOrder: "asc" | "desc") => {
        set({ sortOrder });
        get().sortAndSetFiles(get().files);
    },
    removeTorrent: async (client: AllDebridClient, fileId: string) => {
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
    retryFiles: async (client: AllDebridClient, fileIds: string[]) => {
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
    loadFiles: () => {
        const currentUser = useUserStore.getState().currentUser;
        const cachedFiles = queryClient.getQueryData([currentUser?.id, "getTorrentList", 0]) as
            | { files?: DebridFile[] }
            | undefined;
        if (cachedFiles?.files) {
            get().addFiles(cachedFiles.files);
            return cachedFiles.files;
        }
        return [];
    },
}));
