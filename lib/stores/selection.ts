import { create } from "zustand";

interface SelectionState {
    // Track file selections
    selectedFileIds: Set<string>;
    // Track node selections per file: Map<fileId, Set<nodeId>>
    selectedNodesByFile: Map<string, Set<string>>;
    // Track total nodes per file for calculating selection state
    totalNodesByFile: Map<string, number>;

    // Actions
    registerFileNodes: (fileId: string, nodeIds: string[]) => void;
    toggleFileSelection: (fileId: string, allNodeIds?: string[]) => void;
    updateNodeSelection: (fileId: string, selectedNodeIds: Set<string>) => void;
    getFileSelectionState: (fileId: string) => boolean | "indeterminate";
    isFileFullySelected: (fileId: string) => boolean;
    getAllSelectedNodeIds: () => Set<string>;
    getFullySelectedFileIds: () => string[];
    selectAll: (fileIds: string[]) => void;
    clearAll: () => void;
    removeFileSelection: (fileId: string) => void;
}

export const useSelectionStore = create<SelectionState>((set, get) => ({
    selectedFileIds: new Set(),
    selectedNodesByFile: new Map(),
    totalNodesByFile: new Map(),

    registerFileNodes: (fileId: string, nodeIds: string[]) => {
        set((state) => {
            const newTotalNodesByFile = new Map(state.totalNodesByFile);
            newTotalNodesByFile.set(fileId, nodeIds.length);

            // If file was already selected but had no nodes, select all nodes now
            if (state.selectedFileIds.has(fileId) && nodeIds.length > 0) {
                const currentNodes =
                    state.selectedNodesByFile.get(fileId) || new Set();
                if (currentNodes.size === 0) {
                    const newSelectedNodesByFile = new Map(
                        state.selectedNodesByFile
                    );
                    newSelectedNodesByFile.set(fileId, new Set(nodeIds));
                    return {
                        totalNodesByFile: newTotalNodesByFile,
                        selectedNodesByFile: newSelectedNodesByFile,
                    };
                }
            }

            return { totalNodesByFile: newTotalNodesByFile };
        });
    },

    toggleFileSelection: (fileId: string, allNodeIds?: string[]) => {
        const state = get();
        const currentNodes = state.selectedNodesByFile.get(fileId) || new Set();
        const totalNodes = state.totalNodesByFile.get(fileId) || 0;
        const isIndeterminate =
            totalNodes > 0 &&
            currentNodes.size > 0 &&
            currentNodes.size < totalNodes;
        const isFullySelected =
            (totalNodes === 0 && state.selectedFileIds.has(fileId)) ||
            (totalNodes > 0 && currentNodes.size === totalNodes);

        if (isIndeterminate || !state.selectedFileIds.has(fileId)) {
            // If indeterminate or not selected, select all nodes (or just the file if no nodes)
            set((state) => {
                const newSelectedFileIds = new Set(state.selectedFileIds);
                newSelectedFileIds.add(fileId);

                if (allNodeIds && allNodeIds.length > 0) {
                    const newSelectedNodesByFile = new Map(
                        state.selectedNodesByFile
                    );
                    newSelectedNodesByFile.set(fileId, new Set(allNodeIds));
                    const newTotalNodesByFile = new Map(state.totalNodesByFile);
                    newTotalNodesByFile.set(fileId, allNodeIds.length);
                    return {
                        selectedFileIds: newSelectedFileIds,
                        selectedNodesByFile: newSelectedNodesByFile,
                        totalNodesByFile: newTotalNodesByFile,
                    };
                }

                return { selectedFileIds: newSelectedFileIds };
            });
        } else if (isFullySelected) {
            // If fully selected, deselect everything
            set((state) => {
                const newSelectedFileIds = new Set(state.selectedFileIds);
                newSelectedFileIds.delete(fileId);
                const newSelectedNodesByFile = new Map(
                    state.selectedNodesByFile
                );
                newSelectedNodesByFile.delete(fileId);
                return {
                    selectedFileIds: newSelectedFileIds,
                    selectedNodesByFile: newSelectedNodesByFile,
                };
            });
        }
    },

    updateNodeSelection: (fileId: string, selectedNodeIds: Set<string>) => {
        set((state) => {
            const newSelectedNodesByFile = new Map(state.selectedNodesByFile);
            const newSelectedFileIds = new Set(state.selectedFileIds);

            if (selectedNodeIds.size === 0) {
                newSelectedNodesByFile.delete(fileId);
                // No nodes selected, remove file selection
                newSelectedFileIds.delete(fileId);
            } else {
                newSelectedNodesByFile.set(fileId, selectedNodeIds);
                // Some or all nodes selected, ensure file is selected
                newSelectedFileIds.add(fileId);
            }

            return {
                selectedNodesByFile: newSelectedNodesByFile,
                selectedFileIds: newSelectedFileIds,
            };
        });
    },

    getFileSelectionState: (fileId: string): boolean | "indeterminate" => {
        const state = get();
        if (!state.selectedFileIds.has(fileId)) {
            return false;
        }

        const selectedNodes =
            state.selectedNodesByFile.get(fileId) || new Set();
        const totalNodes = state.totalNodesByFile.get(fileId) || 0;

        // If no nodes are registered (not loaded or don't exist), treat as fully selected
        if (totalNodes === 0) {
            return true;
        }

        // If all nodes are selected, fully selected
        if (selectedNodes.size === totalNodes) {
            return true;
        }

        // Some nodes selected but not all
        if (selectedNodes.size > 0) {
            return "indeterminate";
        }

        // File selected but no nodes selected (edge case)
        return true;
    },

    isFileFullySelected: (fileId: string): boolean => {
        const state = get().getFileSelectionState(fileId);
        return state === true;
    },

    getAllSelectedNodeIds: (): Set<string> => {
        const allNodes = new Set<string>();
        get().selectedNodesByFile.forEach((nodeSet) => {
            nodeSet.forEach((id) => allNodes.add(id));
        });
        return allNodes;
    },

    getFullySelectedFileIds: (): string[] => {
        const state = get();
        return Array.from(state.selectedFileIds).filter((fileId) => {
            const selectedNodes =
                state.selectedNodesByFile.get(fileId) || new Set();
            const totalNodes = state.totalNodesByFile.get(fileId) || 0;

            // Files with no nodes are considered fully selected
            if (totalNodes === 0) {
                return true;
            }

            // Files with all nodes selected are fully selected
            return selectedNodes.size === totalNodes;
        });
    },

    selectAll: (fileIds: string[]) => {
        set({ selectedFileIds: new Set(fileIds) });
    },

    clearAll: () => {
        set({
            selectedFileIds: new Set(),
            selectedNodesByFile: new Map(),
        });
    },

    removeFileSelection: (fileId: string) => {
        set((state) => {
            const newSelectedFileIds = new Set(state.selectedFileIds);
            newSelectedFileIds.delete(fileId);
            const newSelectedNodesByFile = new Map(state.selectedNodesByFile);
            newSelectedNodesByFile.delete(fileId);
            const newTotalNodesByFile = new Map(state.totalNodesByFile);
            newTotalNodesByFile.delete(fileId);
            return {
                selectedFileIds: newSelectedFileIds,
                selectedNodesByFile: newSelectedNodesByFile,
                totalNodesByFile: newTotalNodesByFile,
            };
        });
    },
}));
