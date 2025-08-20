import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

export interface SelectionState {
    selectedFileIds: Set<string>;
    selectedNodesByFile: Map<string, Set<string>>;
    totalNodesByFile: Map<string, number>;
    registeredNodesByFile: Map<string, string[]>; // Store all node IDs when registered

    // Actions
    registerFileNodes: (fileId: string, nodeIds: string[]) => void;
    toggleFileSelection: (fileId: string, allNodeIds?: string[]) => void;
    updateNodeSelection: (fileId: string, selectedNodeIds: Set<string>) => void;
    selectAll: (fileIds: string[]) => void;
    clearAll: () => void;
    removeFileSelection: (fileId: string) => void;
}

export const useSelectionStore = create<SelectionState>()(
    subscribeWithSelector((set) => ({
        selectedFileIds: new Set(),
        selectedNodesByFile: new Map(),
        totalNodesByFile: new Map(),
        registeredNodesByFile: new Map(),

        registerFileNodes: (fileId, nodeIds) =>
            set((state) => {
                const prevTotal = state.totalNodesByFile.get(fileId) || 0;

                // Quick check for unchanged data
                const needsSelectionUpdate =
                    state.selectedFileIds.has(fileId) && !state.selectedNodesByFile.has(fileId) && nodeIds.length > 0;

                if (prevTotal === nodeIds.length && !needsSelectionUpdate) {
                    return state;
                }

                const totalNodesByFile = new Map(state.totalNodesByFile);
                const registeredNodesByFile = new Map(state.registeredNodesByFile);

                totalNodesByFile.set(fileId, nodeIds.length);
                registeredNodesByFile.set(fileId, nodeIds);

                // If file is selected, ensure its nodes are selected
                if (state.selectedFileIds.has(fileId) && nodeIds.length > 0) {
                    const selectedNodesByFile = new Map(state.selectedNodesByFile);

                    // For very large files, we could defer but it's better to just optimize the tree rendering
                    selectedNodesByFile.set(fileId, new Set(nodeIds));

                    return { totalNodesByFile, selectedNodesByFile, registeredNodesByFile };
                }

                return { totalNodesByFile, registeredNodesByFile };
            }),

        toggleFileSelection: (fileId, allNodeIds) =>
            set((state) => {
                const currentNodes = state.selectedNodesByFile.get(fileId) || new Set();
                const totalNodes = state.totalNodesByFile.get(fileId) || 0;
                const isIndeterminate = totalNodes > 0 && currentNodes.size > 0 && currentNodes.size < totalNodes;
                const isFullySelected =
                    (totalNodes === 0 && state.selectedFileIds.has(fileId)) ||
                    (totalNodes > 0 && currentNodes.size === totalNodes);

                const selectedFileIds = new Set(state.selectedFileIds);
                const selectedNodesByFile = new Map(state.selectedNodesByFile);

                if (isIndeterminate || !state.selectedFileIds.has(fileId)) {
                    selectedFileIds.add(fileId);
                    if (allNodeIds?.length) {
                        selectedNodesByFile.set(fileId, new Set(allNodeIds));
                        const totalNodesByFile = new Map(state.totalNodesByFile);
                        const registeredNodesByFile = new Map(state.registeredNodesByFile);
                        totalNodesByFile.set(fileId, allNodeIds.length);
                        registeredNodesByFile.set(fileId, allNodeIds);
                        return { selectedFileIds, selectedNodesByFile, totalNodesByFile, registeredNodesByFile };
                    }
                    return { selectedFileIds };
                } else if (isFullySelected) {
                    selectedFileIds.delete(fileId);
                    selectedNodesByFile.delete(fileId);
                    return { selectedFileIds, selectedNodesByFile };
                }
                return state;
            }),

        updateNodeSelection: (fileId, selectedNodeIds) =>
            set((state) => {
                const selectedNodesByFile = new Map(state.selectedNodesByFile);
                const selectedFileIds = new Set(state.selectedFileIds);

                if (selectedNodeIds.size === 0) {
                    selectedNodesByFile.delete(fileId);
                    selectedFileIds.delete(fileId);
                } else {
                    selectedNodesByFile.set(fileId, selectedNodeIds);
                    selectedFileIds.add(fileId);
                }

                return { selectedNodesByFile, selectedFileIds };
            }),

        selectAll: (fileIds) =>
            set((state) => {
                const selectedFileIds = new Set(fileIds);
                const selectedNodesByFile = new Map();

                // For each file, if we have registered nodes, select them all
                fileIds.forEach((fileId) => {
                    const registeredNodes = state.registeredNodesByFile.get(fileId);
                    if (registeredNodes && registeredNodes.length > 0) {
                        selectedNodesByFile.set(fileId, new Set(registeredNodes));
                    }
                });

                return { selectedFileIds, selectedNodesByFile };
            }),

        clearAll: () =>
            set({
                selectedFileIds: new Set(),
                selectedNodesByFile: new Map(),
            }),

        removeFileSelection: (fileId) =>
            set((state) => {
                const selectedFileIds = new Set(state.selectedFileIds);
                selectedFileIds.delete(fileId);
                const selectedNodesByFile = new Map(state.selectedNodesByFile);
                selectedNodesByFile.delete(fileId);
                const totalNodesByFile = new Map(state.totalNodesByFile);
                totalNodesByFile.delete(fileId);
                const registeredNodesByFile = new Map(state.registeredNodesByFile);
                registeredNodesByFile.delete(fileId);
                return { selectedFileIds, selectedNodesByFile, totalNodesByFile, registeredNodesByFile };
            }),
    }))
);

// Stable selector that returns selection state for a file
export const useFileSelectionState = (fileId: string) =>
    useSelectionStore((state) => {
        if (!state.selectedFileIds.has(fileId)) return false;
        const selectedNodes = state.selectedNodesByFile.get(fileId);
        const totalNodes = state.totalNodesByFile.get(fileId) || 0;
        if (!selectedNodes || totalNodes === 0) return true;
        if (selectedNodes.size === totalNodes) return true;
        if (selectedNodes.size > 0) return "indeterminate";
        return true;
    });
