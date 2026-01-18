import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { enableMapSet } from "immer";
import { DebridNode } from "../types";

// Enable Immer's MapSet plugin for Map and Set support
enableMapSet();

export interface NodeMetadata {
    id: string;
    name: string;
    size: number | undefined;
}

export interface SelectionState {
    selectedFileIds: Set<string>;
    selectedNodesByFile: Map<string, Set<string>>;
    totalNodesByFile: Map<string, number>;
    registeredNodesByFile: Map<string, string[]>;
    nodeMetadata: Map<string, NodeMetadata>;

    // Actions
    registerFileNodes: (fileId: string, nodeIds: string[], nodes?: DebridNode[]) => void;
    toggleFileSelection: (fileId: string, allNodeIds?: string[], nodes?: DebridNode[]) => void;
    updateNodeSelection: (fileId: string, selectedNodeIds: Set<string>, nodes?: DebridNode[]) => void;
    selectAll: (fileIds: string[]) => void;
    clearAll: () => void;
    removeFileSelection: (fileId: string) => void;
    getNodeMetadata: (nodeId: string) => NodeMetadata | undefined;
}

// Optimized metadata extraction - only extract new entries (O(1) check per node)
function extractNodeMetadata(nodes: DebridNode[], state: SelectionState): void {
    const stack = nodes.slice();

    while (stack.length > 0) {
        const node = stack.pop()!;
        if (node.type === "file" && !state.nodeMetadata.has(node.id)) {
            state.nodeMetadata.set(node.id, {
                id: node.id,
                name: node.name,
                size: node.size,
            });
        }
        if (node.children) {
            stack.push(...node.children);
        }
    }
}

export const useSelectionStore = create<SelectionState>()(
    subscribeWithSelector(
        immer((set, get) => ({
            selectedFileIds: new Set(),
            selectedNodesByFile: new Map(),
            totalNodesByFile: new Map(),
            registeredNodesByFile: new Map(),
            nodeMetadata: new Map(),

            // Immer handles immutability - we can "mutate" directly
            registerFileNodes: (fileId, nodeIds, nodes) =>
                set((state) => {
                    const prevTotal = state.totalNodesByFile.get(fileId) || 0;
                    const needsSelectionUpdate =
                        state.selectedFileIds.has(fileId) &&
                        !state.selectedNodesByFile.has(fileId) &&
                        nodeIds.length > 0;

                    // Skip update if nothing changed and no nodes to extract
                    if (prevTotal === nodeIds.length && !needsSelectionUpdate && !nodes) {
                        return;
                    }

                    state.totalNodesByFile.set(fileId, nodeIds.length);
                    state.registeredNodesByFile.set(fileId, nodeIds);

                    // Extract metadata only if nodes provided
                    if (nodes) {
                        extractNodeMetadata(nodes, state);
                    }

                    // Auto-select nodes if file is selected
                    if (state.selectedFileIds.has(fileId) && nodeIds.length > 0) {
                        state.selectedNodesByFile.set(fileId, new Set(nodeIds));
                    }
                }),

            toggleFileSelection: (fileId, allNodeIds, nodes) =>
                set((state) => {
                    // Extract metadata if nodes provided
                    if (nodes) {
                        extractNodeMetadata(nodes, state);
                    }

                    const currentNodes = state.selectedNodesByFile.get(fileId) || new Set();
                    const totalNodes = state.totalNodesByFile.get(fileId) || 0;
                    const isIndeterminate = totalNodes > 0 && currentNodes.size > 0 && currentNodes.size < totalNodes;
                    const isFullySelected =
                        (totalNodes === 0 && state.selectedFileIds.has(fileId)) ||
                        (totalNodes > 0 && currentNodes.size === totalNodes);

                    if (isIndeterminate || !state.selectedFileIds.has(fileId)) {
                        state.selectedFileIds.add(fileId);
                        if (allNodeIds?.length) {
                            state.selectedNodesByFile.set(fileId, new Set(allNodeIds));
                            state.totalNodesByFile.set(fileId, allNodeIds.length);
                            state.registeredNodesByFile.set(fileId, allNodeIds);
                        }
                    } else if (isFullySelected) {
                        state.selectedFileIds.delete(fileId);
                        state.selectedNodesByFile.delete(fileId);
                    }
                }),

            updateNodeSelection: (fileId, selectedNodeIds, nodes) =>
                set((state) => {
                    // Extract metadata if provided
                    if (nodes) {
                        extractNodeMetadata(nodes, state);
                    }

                    if (selectedNodeIds.size === 0) {
                        state.selectedFileIds.delete(fileId);
                        state.selectedNodesByFile.delete(fileId);
                    } else {
                        state.selectedFileIds.add(fileId);
                        state.selectedNodesByFile.set(fileId, selectedNodeIds);
                    }
                }),

            selectAll: (fileIds) =>
                set((state) => {
                    state.selectedFileIds = new Set(fileIds);
                    state.selectedNodesByFile.clear();

                    // For each file, if we have registered nodes, select them all
                    fileIds.forEach((fileId) => {
                        const registeredNodes = state.registeredNodesByFile.get(fileId);
                        if (registeredNodes && registeredNodes.length > 0) {
                            state.selectedNodesByFile.set(fileId, new Set(registeredNodes));
                        }
                    });
                }),

            clearAll: () =>
                set((state) => {
                    state.selectedFileIds.clear();
                    state.selectedNodesByFile.clear();
                }),

            removeFileSelection: (fileId) =>
                set((state) => {
                    state.selectedFileIds.delete(fileId);
                    state.selectedNodesByFile.delete(fileId);
                    state.totalNodesByFile.delete(fileId);
                    state.registeredNodesByFile.delete(fileId);
                }),

            getNodeMetadata: (nodeId) => {
                return get().nodeMetadata.get(nodeId);
            },
        }))
    )
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

// Cache empty Set to avoid creating new instance on every render
const EMPTY_SET = new Set<string>();

// Optimized selector for file nodes - prevents 200+ nodes from re-rendering on every selection change
export const useFileSelectedNodes = (fileId: string) =>
    useSelectionStore((state) => state.selectedNodesByFile.get(fileId) || EMPTY_SET);
