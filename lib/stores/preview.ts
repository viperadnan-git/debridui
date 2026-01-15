import { create } from "zustand";
import { DebridFileNode } from "../types";
import { filterPreviewableFiles } from "../preview/registry";

interface PreviewState {
    // State
    isOpen: boolean;
    currentFile: DebridFileNode | null;
    currentIndex: number;
    previewableFiles: DebridFileNode[];
    fileId: string | null;

    // Actions
    openPreview: (file: DebridFileNode, allFiles: DebridFileNode[], fileId: string) => void;
    closePreview: () => void;
    navigateNext: () => void;
    navigatePrevious: () => void;
    setCurrentIndex: (index: number) => void;
}

export const usePreviewStore = create<PreviewState>()((set, get) => ({
    isOpen: false,
    currentFile: null,
    currentIndex: 0,
    previewableFiles: [],
    fileId: null,

    openPreview: (file, allFiles, fileId) => {
        // Filter files by supported types using registry
        const previewableFiles = filterPreviewableFiles(allFiles);
        const currentIndex = previewableFiles.findIndex((f) => f.id === file.id || f.name === file.name);

        set({
            isOpen: true,
            currentFile: file,
            currentIndex: currentIndex >= 0 ? currentIndex : 0,
            previewableFiles,
            fileId,
        });
    },

    closePreview: () =>
        set({
            isOpen: false,
            currentFile: null,
            currentIndex: 0,
            previewableFiles: [],
            fileId: null,
        }),

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
