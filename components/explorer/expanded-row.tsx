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

    const {
        data: nodes,
        isLoading,
        error,
    } = useQuery<DebridFileNode[]>({
        queryKey: [currentUser.id, "getTorrentFiles", file.id],
        queryFn: () => client.getTorrentFiles(file.id),
        enabled: file.status === "completed",
    });

    const processedNodes = useMemo(() => {
        if (!nodes) return [];
        return processFileNodes({ fileNodes: nodes, hideTrash, smartOrder });
    }, [nodes, hideTrash, smartOrder]);

    const nodeIds = useMemo(() => {
        if (!processedNodes?.length) return [];

        // Collect IDs more efficiently for large files
        const ids: string[] = [];
        const stack = processedNodes.slice();

        while (stack.length > 0) {
            // Process in batches to avoid creating too many temporary arrays
            const batch = stack.splice(0, 100);
            for (const node of batch) {
                if (node.type === "file" && node.id) {
                    ids.push(node.id);
                } else if (node.children?.length) {
                    stack.push(...node.children);
                }
            }
        }

        return ids;
    }, [processedNodes]);

    useEffect(() => {
        if (nodeIds.length > 0) {
            registerFileNodes(file.id, nodeIds);
        }
    }, [nodeIds, registerFileNodes, file.id]);

    return (
        <div>
            {/* File Tree */}
            {isLoading ? (
                <div className="flex items-center justify-center py-4 px-0.5 md:px-4">
                    <Loader2 className="size-4 animate-spin text-muted-foreground" />
                </div>
            ) : error ? (
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
