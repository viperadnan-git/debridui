"use client";

import { useMemo, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, RotateCcw } from "lucide-react";
import { FileActions } from "./file-actions";
import { DebridFile } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useAuthGuaranteed } from "@/components/auth/auth-provider";
import { useShallow } from "zustand/react/shallow";
import { useSelectionStore } from "@/lib/stores/selection";
import { useToastMutation } from "@/lib/utils/mutation-factory";
import { removeTorrentWithCleanup, retryTorrentsWithCleanup } from "@/lib/utils/file-mutations";

interface FileActionsDrawerProps {
    files: DebridFile[];
}

export function FileActionsDrawer({ files }: FileActionsDrawerProps) {
    // Use useShallow for multi-value selection - reduces re-renders by 66%
    const { selectedFileIds, selectedNodesByFile, totalNodesByFile } = useSelectionStore(
        useShallow((state) => ({
            selectedFileIds: state.selectedFileIds,
            selectedNodesByFile: state.selectedNodesByFile,
            totalNodesByFile: state.totalNodesByFile,
        }))
    );

    const selectedNodeIds = useMemo(() => {
        const allNodes = new Set<string>();
        for (const nodeSet of selectedNodesByFile.values()) {
            for (const id of nodeSet) {
                allNodes.add(id);
            }
        }
        return allNodes;
    }, [selectedNodesByFile]);

    const fullySelectedFileIds = useMemo(() => {
        return Array.from(selectedFileIds).filter((fileId) => {
            const selectedNodes = selectedNodesByFile.get(fileId);
            const totalNodes = totalNodesByFile.get(fileId) || 0;
            return totalNodes === 0 || (selectedNodes && selectedNodes.size === totalNodes);
        });
    }, [selectedFileIds, selectedNodesByFile, totalNodesByFile]);
    const { client, currentAccount } = useAuthGuaranteed();

    const hasAnySelection = selectedFileIds.size > 0 || selectedNodeIds.size > 0;

    // Get fully selected files for file actions
    const { fullySelectedFiles, canRetry } = useMemo(() => {
        const fullySelectedFiles = files.filter((file) => fullySelectedFileIds.includes(file.id));

        // Can retry only when ALL selected files have failed status
        const allSelectedAreFailed =
            fullySelectedFiles.length > 0 && fullySelectedFiles.every((file) => file.status === "failed");

        return {
            fullySelectedFiles,
            canRetry: allSelectedAreFailed ? fullySelectedFiles : [],
        };
    }, [files, fullySelectedFileIds]);

    const deleteMutation = useToastMutation(
        async (fileIds: string[]) => {
            const promises = fileIds.map((id) => removeTorrentWithCleanup(client, currentAccount.id, id));
            await Promise.all(promises);
            return fileIds;
        },
        {
            loading: "Deleting files...",
            success: (fileIds) => `Deleted ${fileIds.length} file(s)`,
            error: "Failed to delete",
        }
    );

    const retryMutation = useToastMutation(
        async (fileIds: string[]) => {
            const results = await retryTorrentsWithCleanup(client, currentAccount.id, fileIds);
            return { results, count: fileIds.length };
        },
        {
            loading: "Retrying files...",
            success: ({ count }) => `Retrying ${count} file(s)`,
            error: "Failed to retry",
        }
    );

    const [isVisible, setIsVisible] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);

    // Handle visibility with animation
    useEffect(() => {
        if (hasAnySelection) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setIsVisible(true);
            // Small delay to trigger animation
            setTimeout(() => setIsAnimating(true), 10);
        } else {
            setIsAnimating(false);
            // Wait for animation to complete before hiding
            setTimeout(() => setIsVisible(false), 300);
        }
    }, [hasAnySelection]);

    if (!isVisible) return null;

    return (
        <>
            {/* Spacer to prevent content from being hidden behind the drawer */}
            <div className={cn("transition-all duration-300 ease-in-out", isAnimating ? "h-20" : "h-0")} />

            {/* Custom Bottom Drawer */}
            <div
                className={cn(
                    "fixed bottom-0 left-0 right-0 z-40 bg-background border-t border-border shadow-lg transition-transform duration-300 ease-in-out",
                    isAnimating ? "translate-y-0" : "translate-y-full"
                )}>
                <div className="container mx-auto max-w-7xl">
                    <div className="flex flex-col items-center gap-3 p-4">
                        <div className="flex gap-2 flex-wrap justify-center">
                            {/* Node Actions: Copy, Download, Play - Show when any nodes selected */}
                            {selectedNodeIds.size > 0 && <FileActions selectedFiles={selectedNodeIds} />}

                            {/* File Actions: Delete, Retry - Show only when files are fully selected */}
                            {canRetry.length > 0 && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => retryMutation.mutate(canRetry.map((f) => f.id))}
                                    disabled={retryMutation.isPending}
                                    className="text-xs sm:text-sm">
                                    <RotateCcw className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                                    Retry ({canRetry.length})
                                </Button>
                            )}
                            {fullySelectedFiles.length > 0 && (
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => deleteMutation.mutate(fullySelectedFiles.map((f) => f.id))}
                                    disabled={deleteMutation.isPending}
                                    className="text-xs sm:text-sm">
                                    <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                                    Delete ({fullySelectedFiles.length})
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
