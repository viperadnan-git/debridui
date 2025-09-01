"use client";

import { DebridFile, DebridFileNode } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useEffect } from "react";
import { useAuthContext } from "@/lib/contexts/auth";
import { Loader2 } from "lucide-react";
import { FileTree } from "./file-tree";
import { processFileNodes } from "@/lib/utils/file";
import { useSettingsStore } from "@/lib/stores/settings";
import { useSelectionStore } from "@/lib/stores/selection";

interface ExpandedRowProps {
    file: DebridFile;
}

export function ExpandedRow({ file }: ExpandedRowProps) {
    const { client, currentUser } = useAuthContext();
    const hideTrash = useSettingsStore((state) => state.hideTrash);
    const smartOrder = useSettingsStore((state) => state.smartOrder);
    const registerFileNodes = useSelectionStore((state) => state.registerFileNodes);

    // Use files from DebridFile if available, otherwise fetch them
    const {
        data: fetchedNodes,
        isLoading,
        error,
    } = useQuery<DebridFileNode[]>({
        queryKey: [currentUser.id, "getTorrentFiles", file.id],
        queryFn: () => client.getTorrentFiles(file.id),
        enabled: file.status === "completed" && !file.files, // Only fetch if files not already available
    });

    // Use files from DebridFile or fetched nodes
    const nodes = file.files || fetchedNodes;

    const processedNodes = useMemo(() => {
        if (!nodes) return [];
        return processFileNodes({ fileNodes: nodes, hideTrash, smartOrder });
    }, [nodes, hideTrash, smartOrder]);

    const nodeIds = useMemo(() => {
        if (!processedNodes?.length) return [];

        // Collect IDs more efficiently for large files
        const ids: string[] = [];

        const collectIds = (nodes: DebridFileNode[]) => {
            for (const node of nodes) {
                if (node.type === "file" && node.id) {
                    ids.push(node.id);
                }
                if (node.children?.length) {
                    collectIds(node.children);
                }
            }
        };

        collectIds(processedNodes);
        return ids;
    }, [processedNodes]);

    useEffect(() => {
        if (nodeIds.length > 0) {
            registerFileNodes(file.id, nodeIds);
        }
    }, [nodeIds, registerFileNodes, file.id]);

    // Show loading only if we're fetching and don't have files already
    const showLoading = isLoading && !file.files;

    return (
        <div>
            {/* File Tree */}
            {showLoading ? (
                <div className="flex items-center justify-center py-4 px-0.5 md:px-4">
                    <Loader2 className="size-4 animate-spin text-muted-foreground" />
                </div>
            ) : error && !file.files ? (
                <div className="text-center py-4 text-xs text-red-500 px-0.5 md:px-4">Error loading files</div>
            ) : processedNodes && processedNodes.length > 0 ? (
                <FileTree nodes={processedNodes} fileId={file.id} />
            ) : (
                <div className="text-center py-4 text-xs text-muted-foreground px-0.5 md:px-4">
                    {hideTrash && nodes && nodes.length > 0
                        ? "All files hidden (enable 'Hide Trash' to show them)"
                        : "No files found"}
                </div>
            )}
        </div>
    );
}
