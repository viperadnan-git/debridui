"use client";

import { Button } from "@/components/ui/button";
import { Copy, Download, Loader2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuthContext } from "@/lib/contexts/auth";
import { downloadLinks, copyLinksToClipboard } from "@/lib/utils";
import {
    downloadM3UPlaylist,
    fetchSelectedDownloadLinks,
} from "@/lib/utils/file";

interface FileActionsProps {
    selectedFiles: Set<string>;
}

export function FileActions({ selectedFiles }: FileActionsProps) {
    const { client, currentUser } = useAuthContext();
    const fileIds = Array.from(selectedFiles);

    const copyMutation = useMutation({
        mutationFn: async () => {
            const toastId = toast.loading("Loading links...");
            try {
                const links = await fetchSelectedDownloadLinks(
                    fileIds,
                    client,
                    currentUser.id
                );
                copyLinksToClipboard(links);
                toast.success(`${links.length} link(s) copied to clipboard`, {
                    id: toastId,
                });
                return links;
            } catch (error: unknown) {
                const errorMessage =
                    error instanceof Error ? error.message : "Unknown error";
                toast.error(`Failed to copy: ${errorMessage}`, { id: toastId });
                throw error;
            }
        },
    });

    const downloadMutation = useMutation({
        mutationFn: async () => {
            const toastId = toast.loading("Loading links...");
            try {
                const links = await fetchSelectedDownloadLinks(
                    fileIds,
                    client,
                    currentUser.id
                );
                downloadLinks(links);
                toast.success(`Downloading ${links.length} files`, {
                    id: toastId,
                });
                return links;
            } catch (error: unknown) {
                const errorMessage =
                    error instanceof Error ? error.message : "Unknown error";
                toast.error(`Failed to download: ${errorMessage}`, {
                    id: toastId,
                });
                throw error;
            }
        },
    });

    const playMutation = useMutation({
        mutationFn: async () => {
            const toastId = toast.loading("Loading links...");
            try {
                const links = await fetchSelectedDownloadLinks(
                    fileIds,
                    client,
                    currentUser.id
                );
                downloadM3UPlaylist(links);
                toast.success("Playlist downloaded", { id: toastId });
                return links;
            } catch (error: unknown) {
                const errorMessage =
                    error instanceof Error ? error.message : "Unknown error";
                toast.error(`Failed to create playlist: ${errorMessage}`, {
                    id: toastId,
                });
                throw error;
            }
        },
    });

    const isDisabled = selectedFiles.size === 0;

    return (
        <div className="flex flex-wrap gap-1 sm:gap-2">
            <Button
                variant="outline"
                size="sm"
                disabled={isDisabled || copyMutation.isPending}
                onClick={() => copyMutation.mutate()}
                className="text-xs sm:text-sm h-7 sm:h-8">
                {copyMutation.isPending ? (
                    <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 animate-spin" />
                ) : (
                    <Copy className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                )}
                Copy ({selectedFiles.size})
            </Button>
            <Button
                variant="outline"
                size="sm"
                disabled={isDisabled || downloadMutation.isPending}
                onClick={() => downloadMutation.mutate()}
                className="text-xs sm:text-sm h-7 sm:h-8">
                {downloadMutation.isPending ? (
                    <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 animate-spin" />
                ) : (
                    <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                )}
                Download ({selectedFiles.size})
            </Button>
            <Button
                variant="outline"
                size="sm"
                disabled={isDisabled || playMutation.isPending}
                onClick={() => playMutation.mutate()}
                className="text-xs sm:text-sm h-7 sm:h-8">
                {playMutation.isPending ? (
                    <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 animate-spin" />
                ) : (
                    <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                )}
                Playlist ({selectedFiles.size})
            </Button>
        </div>
    );
}
