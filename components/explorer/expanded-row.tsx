"use client";

import { DebridFile, DebridFileNode } from "@/lib/clients/types";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo, useEffect, useRef } from "react";
import { useAuthContext } from "@/lib/contexts/auth";
import { Loader2 } from "lucide-react";
import { FileTree } from "./file-tree";
import { useSettingsStore } from "@/lib/stores/settings";
import { processFileNodes } from "@/lib/utils/file";

interface ExpandedRowProps {
    file: DebridFile;
    selectedNodes?: Set<string>;
    onNodeSelectionChange?: (nodeSelection: Set<string>) => void;
    onNodesLoaded?: (nodeIds: string[]) => void;
}

export function ExpandedRow({
    file,
    selectedNodes: externalSelectedNodes,
    onNodeSelectionChange,
    onNodesLoaded,
}: ExpandedRowProps) {
    const { client, currentUser } = useAuthContext();
    const [selectedFiles, setSelectedFiles] = useState<Set<string>>(
        externalSelectedNodes || new Set()
    );
    const { smartOrder, hideTrash } = useSettingsStore();

    // Sync with external selection when it changes
    useEffect(() => {
        if (externalSelectedNodes) {
            setSelectedFiles(externalSelectedNodes);
        }
    }, [externalSelectedNodes]);

    // Handle selection changes
    const handleSelectionChange = (newSelection: Set<string>) => {
        setSelectedFiles(newSelection);
        onNodeSelectionChange?.(newSelection);
    };

    const {
        data: nodes,
        isLoading,
        error,
    } = useQuery<DebridFileNode[]>({
        queryKey: [currentUser.id, "getFile", file.id],
        queryFn: () => client.getFile(file.id),
        enabled: file.status === "completed",
    });

    // Process nodes with smart order and trash filtering
    const processedNodes = useMemo(() => {
        if (!nodes) return [];
        return processFileNodes(nodes, smartOrder, hideTrash);
    }, [nodes, smartOrder, hideTrash]);

    // Notify parent about loaded nodes (only once when nodes first load)
    const hasNotifiedNodes = useRef(false);

    useEffect(() => {
        if (
            processedNodes.length > 0 &&
            onNodesLoaded &&
            !hasNotifiedNodes.current
        ) {
            const nodeIds: string[] = [];
            const collectNodeIds = (nodeList: DebridFileNode[]) => {
                nodeList.forEach((node) => {
                    // Only collect file IDs, not folder IDs (to match FileTree behavior)
                    if (node.type === "file" && node.id) {
                        nodeIds.push(node.id);
                    }
                    if (node.children) collectNodeIds(node.children);
                });
            };
            collectNodeIds(processedNodes);
            onNodesLoaded(nodeIds);
            hasNotifiedNodes.current = true;
        }
    }, [processedNodes, onNodesLoaded]);

    return (
        <div className="px-0.5 md:px-4">
            {/* File Tree */}
            <div className="p-2 sm:p-3 md:mt-0">
                {isLoading ? (
                    <div className="flex items-center justify-center py-4">
                        <Loader2 className="size-4 animate-spin text-muted-foreground" />
                    </div>
                ) : error ? (
                    <div className="text-center py-4 text-xs text-red-500">
                        Error loading files
                    </div>
                ) : processedNodes && processedNodes.length > 0 ? (
                    <FileTree
                        nodes={processedNodes}
                        selectedFiles={selectedFiles}
                        onSelectionChange={handleSelectionChange}
                        fileId={file.id}
                    />
                ) : (
                    <div className="text-center py-4 text-xs text-muted-foreground">
                        {hideTrash && nodes && nodes.length > 0
                            ? "All files hidden (enable 'Hide Trash' to show them)"
                            : "No files found"}
                    </div>
                )}
            </div>
        </div>
    );
}
