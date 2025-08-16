import { DebridFile } from "../clients/types";
import { create } from "zustand";
import { PAGE_SIZE } from "../constants";
import { queryClient } from "../query-client";
import AllDebridClient from "../clients/alldebrid";
import { useSelectionStore } from "./selection";

interface FileStoreState {
    files: DebridFile[];
    offset: number;
    hasMore: boolean;
    sortBy: string;
    sortOrder: "asc" | "desc";
    sortChanged: boolean;
    addFiles: (files: DebridFile[]) => void;
    removeFile: (fileId: string) => void;
    sortFiles: () => void;
    setOffset: (offset: number) => void;
    setSortBy: (sortBy: string) => void;
    setSortOrder: (sortOrder: "asc" | "desc") => void;
    deleteFile: (client: AllDebridClient, fileId: string) => Promise<string>;
    retryFiles: (
        client: AllDebridClient,
        fileIds: string[]
    ) => Promise<Record<string, string>>;
}

const initialState = {
    files: [],
    offset: 0,
    hasMore: true,
    sortBy: "date",
    sortOrder: "desc" as const,
    sortChanged: false,
};

export type SortOption = {
    value: string;
    label: string;
};

type SortOptionWithAccessor = SortOption & {
    accessor: (item: DebridFile) => string | number | Date;
};

const sortOptions: SortOptionWithAccessor[] = [
    {
        value: "date",
        label: "Date Added",
        accessor: (file: DebridFile) => file.createdAt,
    },
    {
        value: "name",
        label: "Name",
        accessor: (file: DebridFile) => file.name.toLowerCase(),
    },
    {
        value: "size",
        label: "Size",
        accessor: (file: DebridFile) => file.size,
    },
    {
        value: "status",
        label: "Status",
        accessor: (file: DebridFile) => file.status,
    },
    {
        value: "progress",
        label: "Progress",
        accessor: (file: DebridFile) => file.progress || 0,
    },
    {
        value: "downloaded",
        label: "Downloaded",
        accessor: (file: DebridFile) => file.downloaded || 0,
    },
    {
        value: "downloadSpeed",
        label: "Download Speed",
        accessor: (file: DebridFile) => file.downloadSpeed || 0,
    },
];

export const useFileStore = create<FileStoreState>((set, get) => ({
    ...initialState,
    addFiles: (files: DebridFile[]) => {
        const { offset } = get();
        if (offset === 0) {
            set({ files });
        } else {
            const existingIds = new Set(get().files.map((f) => f.id));
            const newFiles = files.filter((f) => !existingIds.has(f.id));
            if (newFiles.length > 0) {
                set((state) => ({
                    files: [...state.files, ...newFiles],
                    hasMore: files.length === PAGE_SIZE + offset,
                }));
                get().sortFiles();
            }
        }
    },
    removeFile: (fileId: string) => {
        set((state) => ({
            files: state.files.filter((f) => f.id !== fileId),
        }));
    },
    sortFiles: () => {
        const { sortBy, sortOrder, sortChanged } = get();
        if (sortBy === "date" && sortOrder === "desc" && !sortChanged) {
            console.log("skipping sort");
            return;
        }

        const sortOption = sortOptions.find((opt) => opt.value === sortBy);
        if (!sortOption) return;

        set({ sortChanged: true });
        const sortedFiles = [...get().files].sort((a, b) => {
            const aValue = sortOption.accessor(a);
            const bValue = sortOption.accessor(b);

            if (aValue === bValue) return 0;

            if (sortBy === "date") {
                const aDate = new Date(aValue).getTime();
                const bDate = new Date(bValue).getTime();
                return sortOrder === "desc" ? bDate - aDate : aDate - bDate;
            }

            if (typeof aValue === "number" && typeof bValue === "number") {
                return sortOrder === "desc" ? bValue - aValue : aValue - bValue;
            }

            const comparison = String(aValue).localeCompare(String(bValue));
            return sortOrder === "desc" ? -comparison : comparison;
        });
        set({ files: sortedFiles });
    },
    setOffset: (offset: number) => {
        set({ offset });
    },
    setSortBy: (sortBy: string) => {
        set({ sortBy });
        console.log("setSortBy", sortBy);
        get().sortFiles();
    },
    setSortOrder: (sortOrder: "asc" | "desc") => {
        set({ sortOrder });
        get().sortFiles();
    },
    deleteFile: async (client: AllDebridClient, fileId: string) => {
        const message = await client.deleteFile(fileId);
        get().removeFile(fileId);
        // Clear selection for this file
        useSelectionStore.getState().removeFileSelection(fileId);
        queryClient.invalidateQueries({ queryKey: ["listFiles"] });
        queryClient.invalidateQueries({ queryKey: ["searchFiles"] });
        return message;
    },
    retryFiles: async (client: AllDebridClient, fileIds: string[]) => {
        const message = await client.retryFile(fileIds);
        queryClient.invalidateQueries({ queryKey: ["listFiles"] });
        queryClient.invalidateQueries({ queryKey: ["searchFiles"] });
        return message;
    },
}));
