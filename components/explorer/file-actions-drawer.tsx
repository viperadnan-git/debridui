"use client";

import { useMemo, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, RotateCcw } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { FileActions } from "./file-actions";
import { DebridFile } from "@/lib/clients/types";
import { cn } from "@/lib/utils";
import { useFileStore } from "@/lib/stores/files";
import { useAuthContext } from "@/lib/contexts/auth";

interface FileActionsDrawerProps {
    selectedFileIds: Set<string>;
    selectedNodeIds: Set<string>;
    fullySelectedFileIds: string[];
    files: DebridFile[];
}

export function FileActionsDrawer({
    selectedFileIds,
    selectedNodeIds,
    fullySelectedFileIds,
    files,
}: FileActionsDrawerProps) {
    const { client } = useAuthContext();
    const { removeTorrent, retryFiles } = useFileStore();

    // Check if drawer should be shown
    const hasAnySelection =
        selectedFileIds.size > 0 || selectedNodeIds.size > 0;

    // Get fully selected files for file actions
    const { fullySelectedFiles, canRetry } = useMemo(() => {
        const fullySelectedFiles = files.filter((file) =>
            fullySelectedFileIds.includes(file.id)
        );

        // Can retry only when ALL selected files have failed status
        const allSelectedAreFailed =
            fullySelectedFiles.length > 0 &&
            fullySelectedFiles.every((file) => file.status === "failed");

        return {
            fullySelectedFiles,
            canRetry: allSelectedAreFailed ? fullySelectedFiles : [],
        };
    }, [files, fullySelectedFileIds]);

    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: async (fileIds: string[]) => {
            const promises = fileIds.map((id) => removeTorrent(client, id));
            await Promise.all(promises);
            return fileIds;
        },
        onSuccess: (fileIds) => {
            // Selection clearing is now handled in the store's removeTorrent
            toast.success(`Deleted ${fileIds.length} file(s)`);
        },
        onError: (error: Error) => {
            toast.error(`Failed to delete: ${error.message}`);
        },
    });

    // Retry mutation
    const retryMutation = useMutation({
        mutationFn: async (fileIds: string[]) => {
            return retryFiles(client, fileIds);
        },
        onSuccess: (results) => {
            Object.entries(results).forEach(([magnet, message]) => {
                toast.success(`Retrying ${magnet}: ${message}`);
            });
        },
        onError: (error: Error) => {
            toast.error(`Failed to retry: ${error.message}`);
        },
    });

    const [isVisible, setIsVisible] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);

    // Handle visibility with animation
    useEffect(() => {
        if (hasAnySelection) {
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
            <div
                className={cn(
                    "transition-all duration-300 ease-in-out",
                    isAnimating ? "h-20" : "h-0"
                )}
            />

            {/* Custom Bottom Drawer */}
            <div
                className={cn(
                    "fixed bottom-0 left-0 right-0 z-40 bg-background border-t border-border shadow-lg transition-transform duration-300 ease-in-out",
                    isAnimating ? "translate-y-0" : "translate-y-full"
                )}
            >
                <div className="container mx-auto max-w-7xl">
                    <div className="flex flex-col items-center gap-3 p-4">
                        <div className="flex gap-2 flex-wrap justify-center">
                            {/* Node Actions: Copy, Download, Play - Show when any nodes selected */}
                            {selectedNodeIds.size > 0 && (
                                <FileActions selectedFiles={selectedNodeIds} />
                            )}

                            {/* File Actions: Delete, Retry - Show only when files are fully selected */}
                            {fullySelectedFiles.length > 0 && (
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() =>
                                        deleteMutation.mutate(
                                            fullySelectedFiles.map((f) => f.id)
                                        )
                                    }
                                    disabled={deleteMutation.isPending}
                                    className="text-xs sm:text-sm h-7 sm:h-8"
                                >
                                    <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                                    Delete ({fullySelectedFiles.length})
                                </Button>
                            )}

                            {canRetry.length > 0 && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                        retryMutation.mutate(
                                            canRetry.map((f) => f.id)
                                        )
                                    }
                                    disabled={retryMutation.isPending}
                                    className="text-xs sm:text-sm h-7 sm:h-8"
                                >
                                    <RotateCcw className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                                    Retry ({canRetry.length})
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
