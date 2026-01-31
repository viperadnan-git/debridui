"use client";

import { DebridFile, DebridNode } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useEffect } from "react";
import { useAuthGuaranteed } from "@/components/auth/auth-provider";
import { Loader2 } from "lucide-react";
import dynamic from "next/dynamic";
import { processFileNodes, collectNodeIds } from "@/lib/utils/file";
import { useSettingsStore } from "@/lib/stores/settings";
import { useSelectionStore } from "@/lib/stores/selection";

// Dynamic import for FileTree to reduce initial bundle size (~403 lines)
const FileTree = dynamic(() => import("./file-tree").then((m) => ({ default: m.FileTree })), {
    loading: () => (
        <div className="flex items-center justify-center py-4 px-0.5 md:px-4">
            <Loader2 className="size-4 animate-spin text-muted-foreground" />
        </div>
    ),
    ssr: false,
});

interface ExpandedRowProps {
    file: DebridFile;
}

export function ExpandedRow({ file }: ExpandedRowProps) {
    const { client, currentAccount } = useAuthGuaranteed();
    const { get } = useSettingsStore();
    const hideTrash = get("hideTrash");
    const smartOrder = get("smartOrder");
    const registerFileNodes = useSelectionStore((state) => state.registerFileNodes);

    // Use files from DebridFile if available, otherwise fetch them
    const {
        data: fetchedNodes,
        isLoading,
        error,
    } = useQuery<DebridNode[]>({
        queryKey: [currentAccount.id, "getTorrentFiles", file.id],
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
        return collectNodeIds(processedNodes);
    }, [processedNodes]);

    useEffect(() => {
        if (nodeIds.length > 0 && processedNodes.length > 0) {
            registerFileNodes(file.id, nodeIds, processedNodes);
        }
    }, [nodeIds, processedNodes, registerFileNodes, file.id]);

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
                <div className="text-center py-4 text-xs text-destructive px-0.5 md:px-4">Error loading files</div>
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
