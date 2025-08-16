import { useState, useCallback } from "react";

// Hook for managing hierarchical selection (files and nodes)
export function useHierarchicalSelection() {
    // Track file selections
    const [selectedFileIds, setSelectedFileIds] = useState<Set<string>>(
        new Set()
    );
    // Track node selections per file: Map<fileId, Set<nodeId>>
    const [selectedNodesByFile, setSelectedNodesByFile] = useState<
        Map<string, Set<string>>
    >(new Map());
    // Track total nodes per file for calculating selection state
    const [totalNodesByFile, setTotalNodesByFile] = useState<
        Map<string, number>
    >(new Map());

    // Register total nodes for a file (called when expanding)
    const registerFileNodes = useCallback(
        (fileId: string, nodeIds: string[]) => {
            setTotalNodesByFile((prev) => {
                const newMap = new Map(prev);
                newMap.set(fileId, nodeIds.length);
                return newMap;
            });

            // If file was already selected but had no nodes, select all nodes now
            if (selectedFileIds.has(fileId) && nodeIds.length > 0) {
                const currentNodes =
                    selectedNodesByFile.get(fileId) || new Set();
                if (currentNodes.size === 0) {
                    setSelectedNodesByFile((prev) => {
                        const newMap = new Map(prev);
                        newMap.set(fileId, new Set(nodeIds));
                        return newMap;
                    });
                }
            }
        },
        [selectedFileIds, selectedNodesByFile]
    );

    // Handle file checkbox click
    const toggleFileSelection = useCallback(
        (fileId: string, allNodeIds?: string[]) => {
            const currentNodes = selectedNodesByFile.get(fileId) || new Set();
            const totalNodes = totalNodesByFile.get(fileId) || 0;
            const isIndeterminate =
                totalNodes > 0 &&
                currentNodes.size > 0 &&
                currentNodes.size < totalNodes;
            const isFullySelected =
                (totalNodes === 0 && selectedFileIds.has(fileId)) ||
                (totalNodes > 0 && currentNodes.size === totalNodes);

            if (isIndeterminate || !selectedFileIds.has(fileId)) {
                // If indeterminate or not selected, select all nodes (or just the file if no nodes)
                setSelectedFileIds((prev) => {
                    const newSet = new Set(prev);
                    newSet.add(fileId);
                    return newSet;
                });
                if (allNodeIds && allNodeIds.length > 0) {
                    setSelectedNodesByFile((prev) => {
                        const newMap = new Map(prev);
                        newMap.set(fileId, new Set(allNodeIds));
                        return newMap;
                    });
                    setTotalNodesByFile((prev) => {
                        const newMap = new Map(prev);
                        newMap.set(fileId, allNodeIds.length);
                        return newMap;
                    });
                }
            } else if (isFullySelected) {
                // If fully selected, deselect everything
                setSelectedFileIds((prev) => {
                    const newSet = new Set(prev);
                    newSet.delete(fileId);
                    return newSet;
                });
                setSelectedNodesByFile((prev) => {
                    const newMap = new Map(prev);
                    newMap.delete(fileId);
                    return newMap;
                });
            }
        },
        [selectedFileIds, selectedNodesByFile, totalNodesByFile]
    );

    // Handle node selection changes
    const updateNodeSelection = useCallback(
        (fileId: string, selectedNodeIds: Set<string>) => {
            setSelectedNodesByFile((prev) => {
                const newMap = new Map(prev);
                if (selectedNodeIds.size === 0) {
                    newMap.delete(fileId);
                } else {
                    newMap.set(fileId, selectedNodeIds);
                }
                return newMap;
            });

            // Update file selection based on node selection
            setSelectedFileIds((prev) => {
                const newSet = new Set(prev);
                if (selectedNodeIds.size === 0) {
                    // No nodes selected, remove file selection
                    newSet.delete(fileId);
                } else {
                    // Some or all nodes selected, ensure file is selected
                    newSet.add(fileId);
                }
                return newSet;
            });
        },
        []
    );

    // Get file selection state (true, false, or "indeterminate")
    const getFileSelectionState = useCallback(
        (fileId: string): boolean | "indeterminate" => {
            if (!selectedFileIds.has(fileId)) {
                return false;
            }

            const selectedNodes = selectedNodesByFile.get(fileId) || new Set();
            const totalNodes = totalNodesByFile.get(fileId) || 0;

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
        [selectedFileIds, selectedNodesByFile, totalNodesByFile]
    );

    // Check if file is fully selected (all nodes selected)
    const isFileFullySelected = useCallback(
        (fileId: string): boolean => {
            const state = getFileSelectionState(fileId);
            return state === true;
        },
        [getFileSelectionState]
    );

    // Get all selected node IDs
    const getAllSelectedNodeIds = useCallback((): Set<string> => {
        const allNodes = new Set<string>();
        selectedNodesByFile.forEach((nodeSet) => {
            nodeSet.forEach((id) => allNodes.add(id));
        });
        return allNodes;
    }, [selectedNodesByFile]);

    // Get fully selected file IDs
    const getFullySelectedFileIds = useCallback((): string[] => {
        return Array.from(selectedFileIds).filter((fileId) => {
            const selectedNodes = selectedNodesByFile.get(fileId) || new Set();
            const totalNodes = totalNodesByFile.get(fileId) || 0;

            // Files with no nodes are considered fully selected
            if (totalNodes === 0) {
                return true;
            }

            // Files with all nodes selected are fully selected
            return selectedNodes.size === totalNodes;
        });
    }, [selectedFileIds, selectedNodesByFile, totalNodesByFile]);

    // Select all files
    const selectAll = useCallback((fileIds: string[]) => {
        setSelectedFileIds(new Set(fileIds));
    }, []);

    // Clear all selections
    const clearAll = useCallback(() => {
        setSelectedFileIds(new Set());
        setSelectedNodesByFile(new Map());
    }, []);

    return {
        selectedFileIds,
        selectedNodesByFile,
        toggleFileSelection,
        updateNodeSelection,
        getFileSelectionState,
        isFileFullySelected,
        getAllSelectedNodeIds,
        getFullySelectedFileIds,
        registerFileNodes,
        selectAll,
        clearAll,
    };
}
