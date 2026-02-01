import { create } from "zustand";
import { DebridFileNode, FileType } from "../types";
import { filterPreviewableFiles } from "../preview/registry";

type PreviewMode = "gallery" | "single";

interface SinglePreviewOptions {
    url: string;
    title: string;
    fileType?: FileType;
}

interface PreviewState {
    // State
    isOpen: boolean;
    mode: PreviewMode;
    currentFile: DebridFileNode | null;
    currentIndex: number;
    previewableFiles: DebridFileNode[];
    fileId: string | null;
    // Single mode state (direct URL, no API fetch)
    directUrl: string | null;
    directTitle: string | null;
    fileType: FileType | null;

    // Actions
    openPreview: (file: DebridFileNode, allFiles: DebridFileNode[], fileId: string) => void;
    openSinglePreview: (options: SinglePreviewOptions) => void;
    closePreview: () => void;
    navigateNext: () => void;
    navigatePrevious: () => void;
    setCurrentIndex: (index: number) => void;
}

const initialState = {
    isOpen: false,
    mode: "gallery" as PreviewMode,
    currentFile: null,
    currentIndex: 0,
    previewableFiles: [],
    fileId: null,
    directUrl: null,
    directTitle: null,
    fileType: null,
};

export const usePreviewStore = create<PreviewState>()((set, get) => ({
    ...initialState,

    openPreview: (file, allFiles, fileId) => {
        // Filter files by supported types using registry
        const previewableFiles = filterPreviewableFiles(allFiles);
        const currentIndex = previewableFiles.findIndex((f) => f.id === file.id || f.name === file.name);

        set({
            isOpen: true,
            mode: "gallery",
            currentFile: file,
            currentIndex: currentIndex >= 0 ? currentIndex : 0,
            previewableFiles,
            fileId,
            directUrl: null,
            directTitle: null,
            fileType: null,
        });
    },

    openSinglePreview: ({ url, title, fileType }) => {
        set({
            isOpen: true,
            mode: "single",
            directUrl: url,
            directTitle: title,
            fileType: fileType ?? null,
            currentFile: null,
            currentIndex: 0,
            previewableFiles: [],
            fileId: null,
        });
    },

    closePreview: () => set(initialState),

    navigateNext: () => {
        const { currentIndex, previewableFiles } = get();
        if (previewableFiles.length === 0) return;

        const nextIndex = (currentIndex + 1) % previewableFiles.length;
        set({
            currentIndex: nextIndex,
            currentFile: previewableFiles[nextIndex],
        });
    },

    navigatePrevious: () => {
        const { currentIndex, previewableFiles } = get();
        if (previewableFiles.length === 0) return;

        const prevIndex = currentIndex === 0 ? previewableFiles.length - 1 : currentIndex - 1;
        set({
            currentIndex: prevIndex,
            currentFile: previewableFiles[prevIndex],
        });
    },

    setCurrentIndex: (index) => {
        const { previewableFiles } = get();
        if (index >= 0 && index < previewableFiles.length) {
            set({
                currentIndex: index,
                currentFile: previewableFiles[index],
            });
        }
    },
}));
