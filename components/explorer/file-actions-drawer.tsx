"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, RotateCcw, X, Copy, Download, ListMusic, Loader2 } from "lucide-react";
import { DebridFile } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useShallow } from "zustand/react/shallow";
import { useSelectionStore } from "@/lib/stores/selection";
import { useFileMutationActions, useFileLinkActions } from "@/hooks/use-file-actions";

interface FileActionsDrawerProps {
    files: DebridFile[];
}

export function FileActionsDrawer({ files }: FileActionsDrawerProps) {
    const { selectedFileIds, selectedNodesByFile, totalNodesByFile, clearAll } = useSelectionStore(
        useShallow((state) => ({
            selectedFileIds: state.selectedFileIds,
            selectedNodesByFile: state.selectedNodesByFile,
            totalNodesByFile: state.totalNodesByFile,
            clearAll: state.clearAll,
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

    const selectedNodeIdsArray = useMemo(() => Array.from(selectedNodeIds), [selectedNodeIds]);

    const fullySelectedFileIds = useMemo(() => {
        return Array.from(selectedFileIds).filter((fileId) => {
            const selectedNodes = selectedNodesByFile.get(fileId);
            const totalNodes = totalNodesByFile.get(fileId) || 0;
            return totalNodes === 0 || (selectedNodes && selectedNodes.size === totalNodes);
        });
    }, [selectedFileIds, selectedNodesByFile, totalNodesByFile]);

    const hasAnySelection = selectedFileIds.size > 0 || selectedNodeIds.size > 0;
    const hasNodes = selectedNodeIds.size > 0;

    const { fullySelectedFiles, canRetry } = useMemo(() => {
        const fullySelectedFiles = files.filter((file) => fullySelectedFileIds.includes(file.id));
        const allSelectedAreFailed =
            fullySelectedFiles.length > 0 && fullySelectedFiles.every((file) => file.status === "failed");

        return {
            fullySelectedFiles,
            canRetry: allSelectedAreFailed ? fullySelectedFiles : [],
        };
    }, [files, fullySelectedFileIds]);

    const { deleteMutation, retryMutation } = useFileMutationActions();
    const { copyMutation, downloadMutation, playlistMutation } = useFileLinkActions(selectedNodeIdsArray);

    return (
        <>
            {/* Spacer */}
            <div className={cn("transition-all duration-300 ease-in-out", hasAnySelection ? "h-32 sm:h-20" : "h-0")} />

            {/* Bottom Drawer */}
            <div
                className={cn(
                    "fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-sm border-t border-border/50 shadow-lg transition-transform duration-300 ease-in-out",
                    hasAnySelection ? "translate-y-0" : "translate-y-full pointer-events-none"
                )}>
                <div className="container mx-auto max-w-7xl px-4 py-3">
                    {/* Mobile: 2 rows (3+3) | Tablet+: single flex row */}
                    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-center">
                        {/* Row 1: Copy / Download / Playlist */}
                        {hasNodes && (
                            <div className="grid grid-cols-3 gap-2 w-full sm:w-auto sm:flex">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={copyMutation.isPending}
                                    onClick={() => copyMutation.mutate()}
                                    className="w-full sm:w-auto">
                                    {copyMutation.isPending ? (
                                        <Loader2 className="size-4 sm:mr-2 animate-spin" />
                                    ) : (
                                        <Copy className="size-4 sm:mr-2" />
                                    )}
                                    <span className="hidden sm:inline">Copy</span> ({selectedNodeIds.size})
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={downloadMutation.isPending}
                                    onClick={() => downloadMutation.mutate()}
                                    className="w-full sm:w-auto">
                                    {downloadMutation.isPending ? (
                                        <Loader2 className="size-4 sm:mr-2 animate-spin" />
                                    ) : (
                                        <Download className="size-4 sm:mr-2" />
                                    )}
                                    <span className="hidden sm:inline">Download</span> ({selectedNodeIds.size})
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={playlistMutation.isPending}
                                    onClick={() => playlistMutation.mutate()}
                                    className="w-full sm:w-auto">
                                    {playlistMutation.isPending ? (
                                        <Loader2 className="size-4 sm:mr-2 animate-spin" />
                                    ) : (
                                        <ListMusic className="size-4 sm:mr-2" />
                                    )}
                                    <span className="hidden sm:inline">Playlist</span> ({selectedNodeIds.size})
                                </Button>
                            </div>
                        )}

                        {/* Row 2: Retry / Delete / Clear - flex to handle variable button count */}
                        <div className="flex gap-2 w-full sm:w-auto sm:flex">
                            {canRetry.length > 0 && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => retryMutation.mutate(canRetry.map((f) => f.id))}
                                    disabled={retryMutation.isPending}
                                    className="flex-1 sm:flex-none">
                                    <RotateCcw className="size-4 sm:mr-2" />
                                    <span className="hidden sm:inline">Retry</span> ({canRetry.length})
                                </Button>
                            )}
                            {fullySelectedFiles.length > 0 && (
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => deleteMutation.mutate(fullySelectedFiles.map((f) => f.id))}
                                    disabled={deleteMutation.isPending}
                                    className="flex-1 sm:flex-none">
                                    <Trash2 className="size-4 sm:mr-2" />
                                    <span className="hidden sm:inline">Delete</span> ({fullySelectedFiles.length})
                                </Button>
                            )}
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={clearAll}
                                className="flex-1 sm:flex-none text-muted-foreground hover:text-foreground">
                                <X className="size-4 sm:mr-2" />
                                <span className="hidden sm:inline">Clear</span>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
