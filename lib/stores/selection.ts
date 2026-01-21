import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { DebridNode } from "../types";

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
function extractNodeMetadata(
    nodes: DebridNode[],
    existingMetadata: Map<string, NodeMetadata>
): Map<string, NodeMetadata> {
    const newMetadata = new Map(existingMetadata);
    const stack = nodes.slice();

    while (stack.length > 0) {
        const node = stack.pop()!;
        if (node.type === "file" && !newMetadata.has(node.id)) {
            newMetadata.set(node.id, {
                id: node.id,
                name: node.name,
                size: node.size,
            });
        }
        if (node.children) {
            stack.push(...node.children);
        }
    }

    return newMetadata;
}

export const useSelectionStore = create<SelectionState>()(
    subscribeWithSelector((set, get) => ({
        selectedFileIds: new Set(),
        selectedNodesByFile: new Map(),
        totalNodesByFile: new Map(),
        registeredNodesByFile: new Map(),
        nodeMetadata: new Map(),

        registerFileNodes: (fileId, nodeIds, nodes) =>
            set((state) => {
                const prevTotal = state.totalNodesByFile.get(fileId) || 0;
                const needsSelectionUpdate =
                    state.selectedFileIds.has(fileId) && !state.selectedNodesByFile.has(fileId) && nodeIds.length > 0;

                // Skip update if nothing changed and no nodes to extract
                if (prevTotal === nodeIds.length && !needsSelectionUpdate && !nodes) {
                    return state;
                }

                const newTotalNodesByFile = new Map(state.totalNodesByFile);
                newTotalNodesByFile.set(fileId, nodeIds.length);

                const newRegisteredNodesByFile = new Map(state.registeredNodesByFile);
                newRegisteredNodesByFile.set(fileId, nodeIds);

                // Extract metadata only if nodes provided
                const newNodeMetadata = nodes ? extractNodeMetadata(nodes, state.nodeMetadata) : state.nodeMetadata;

                // Auto-select nodes if file is selected
                const newSelectedNodesByFile = new Map(state.selectedNodesByFile);
                if (state.selectedFileIds.has(fileId) && nodeIds.length > 0) {
                    newSelectedNodesByFile.set(fileId, new Set(nodeIds));
                }

                return {
                    ...state,
                    totalNodesByFile: newTotalNodesByFile,
                    registeredNodesByFile: newRegisteredNodesByFile,
                    nodeMetadata: newNodeMetadata,
                    selectedNodesByFile: newSelectedNodesByFile,
                };
            }),

        toggleFileSelection: (fileId, allNodeIds, nodes) =>
            set((state) => {
                // Extract metadata if nodes provided
                const newNodeMetadata = nodes ? extractNodeMetadata(nodes, state.nodeMetadata) : state.nodeMetadata;

                const currentNodes = state.selectedNodesByFile.get(fileId) || new Set();
                const totalNodes = state.totalNodesByFile.get(fileId) || 0;
                const isIndeterminate = totalNodes > 0 && currentNodes.size > 0 && currentNodes.size < totalNodes;
                const isFullySelected =
                    (totalNodes === 0 && state.selectedFileIds.has(fileId)) ||
                    (totalNodes > 0 && currentNodes.size === totalNodes);

                if (isIndeterminate || !state.selectedFileIds.has(fileId)) {
                    const newSelectedFileIds = new Set(state.selectedFileIds);
                    newSelectedFileIds.add(fileId);

                    const newSelectedNodesByFile = new Map(state.selectedNodesByFile);
                    const newTotalNodesByFile = new Map(state.totalNodesByFile);
                    const newRegisteredNodesByFile = new Map(state.registeredNodesByFile);

                    if (allNodeIds?.length) {
                        newSelectedNodesByFile.set(fileId, new Set(allNodeIds));
                        newTotalNodesByFile.set(fileId, allNodeIds.length);
                        newRegisteredNodesByFile.set(fileId, allNodeIds);
                    }

                    return {
                        ...state,
                        selectedFileIds: newSelectedFileIds,
                        selectedNodesByFile: newSelectedNodesByFile,
                        totalNodesByFile: newTotalNodesByFile,
                        registeredNodesByFile: newRegisteredNodesByFile,
                        nodeMetadata: newNodeMetadata,
                    };
                } else if (isFullySelected) {
                    const newSelectedFileIds = new Set(state.selectedFileIds);
                    newSelectedFileIds.delete(fileId);

                    const newSelectedNodesByFile = new Map(state.selectedNodesByFile);
                    newSelectedNodesByFile.delete(fileId);

                    return {
                        ...state,
                        selectedFileIds: newSelectedFileIds,
                        selectedNodesByFile: newSelectedNodesByFile,
                        nodeMetadata: newNodeMetadata,
                    };
                }

                return state;
            }),

        updateNodeSelection: (fileId, selectedNodeIds, nodes) =>
            set((state) => {
                // Extract metadata if provided
                const newNodeMetadata = nodes ? extractNodeMetadata(nodes, state.nodeMetadata) : state.nodeMetadata;

                const newSelectedFileIds = new Set(state.selectedFileIds);
                const newSelectedNodesByFile = new Map(state.selectedNodesByFile);

                if (selectedNodeIds.size === 0) {
                    newSelectedFileIds.delete(fileId);
                    newSelectedNodesByFile.delete(fileId);
                } else {
                    newSelectedFileIds.add(fileId);
                    newSelectedNodesByFile.set(fileId, selectedNodeIds);
                }

                return {
                    ...state,
                    selectedFileIds: newSelectedFileIds,
                    selectedNodesByFile: newSelectedNodesByFile,
                    nodeMetadata: newNodeMetadata,
                };
            }),

        selectAll: (fileIds) =>
            set((state) => {
                const newSelectedFileIds = new Set(fileIds);
                const newSelectedNodesByFile = new Map<string, Set<string>>();

                // For each file, if we have registered nodes, select them all
                fileIds.forEach((fileId) => {
                    const registeredNodes = state.registeredNodesByFile.get(fileId);
                    if (registeredNodes && registeredNodes.length > 0) {
                        newSelectedNodesByFile.set(fileId, new Set(registeredNodes));
                    }
                });

                return {
                    ...state,
                    selectedFileIds: newSelectedFileIds,
                    selectedNodesByFile: newSelectedNodesByFile,
                };
            }),

        clearAll: () =>
            set((state) => ({
                ...state,
                selectedFileIds: new Set(),
                selectedNodesByFile: new Map(),
            })),

        removeFileSelection: (fileId) =>
            set((state) => {
                const newSelectedFileIds = new Set(state.selectedFileIds);
                newSelectedFileIds.delete(fileId);

                const newSelectedNodesByFile = new Map(state.selectedNodesByFile);
                newSelectedNodesByFile.delete(fileId);

                const newTotalNodesByFile = new Map(state.totalNodesByFile);
                newTotalNodesByFile.delete(fileId);

                const newRegisteredNodesByFile = new Map(state.registeredNodesByFile);
                newRegisteredNodesByFile.delete(fileId);

                return {
                    ...state,
                    selectedFileIds: newSelectedFileIds,
                    selectedNodesByFile: newSelectedNodesByFile,
                    totalNodesByFile: newTotalNodesByFile,
                    registeredNodesByFile: newRegisteredNodesByFile,
                };
            }),

        getNodeMetadata: (nodeId) => {
            return get().nodeMetadata.get(nodeId);
        },
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

// Cache empty Set to avoid creating new instance on every render
const EMPTY_SET = new Set<string>();

// Optimized selector for file nodes - prevents 200+ nodes from re-rendering on every selection change
export const useFileSelectedNodes = (fileId: string) =>
    useSelectionStore((state) => state.selectedNodesByFile.get(fileId) || EMPTY_SET);
