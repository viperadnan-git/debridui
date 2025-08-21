"use client";

import React, { Fragment } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Copy, Download, RotateCw, Trash2, List, Loader2 } from "lucide-react";
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuSeparator,
    ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { DebridFile } from "@/lib/types";
import { useAuthContext } from "@/lib/contexts/auth";
import { downloadLinks, copyLinksToClipboard } from "@/lib/utils";
import { downloadM3UPlaylist, fetchTorrentDownloadLinks } from "@/lib/utils/file";
import { useFileStore } from "@/lib/stores/files";

interface FileItemContextMenuProps {
    file: DebridFile;
    children: React.ReactNode;
    className?: string;
}

export function FileItemContextMenu({ file, children, className }: FileItemContextMenuProps) {
    const { client, currentUser } = useAuthContext();
    const { removeTorrent, retryFiles } = useFileStore();

    // Copy mutation
    const copyMutation = useMutation({
        mutationFn: async () => {
            const toastId = toast.loading("Loading file links...");
            try {
                const links = await fetchTorrentDownloadLinks(file.id, client, currentUser.id);
                copyLinksToClipboard(links);
                toast.success(`${links.length} link(s) copied to clipboard`, {
                    id: toastId,
                });
                return links;
            } catch (error: unknown) {
                const errorMessage = error instanceof Error ? error.message : "Unknown error";
                toast.error(`Failed to copy: ${errorMessage}`, { id: toastId });
                throw error;
            }
        },
    });

    // Download mutation
    const downloadMutation = useMutation({
        mutationFn: async () => {
            const toastId = toast.loading("Loading file links...");
            try {
                const links = await fetchTorrentDownloadLinks(file.id, client, currentUser.id);
                downloadLinks(links);
                toast.success(`Downloading ${links.length} file(s)`, {
                    id: toastId,
                });
                return links;
            } catch (error: unknown) {
                const errorMessage = error instanceof Error ? error.message : "Unknown error";
                toast.error(`Failed to download: ${errorMessage}`, {
                    id: toastId,
                });
                throw error;
            }
        },
    });

    // Download playlist mutation
    const playlistMutation = useMutation({
        mutationFn: async () => {
            const toastId = toast.loading("Loading file links...");
            try {
                const links = await fetchTorrentDownloadLinks(file.id, client, currentUser.id);
                downloadM3UPlaylist(links);
                toast.success("Playlist downloaded", { id: toastId });
                return links;
            } catch (error: unknown) {
                const errorMessage = error instanceof Error ? error.message : "Unknown error";
                toast.error(`Failed to download playlist: ${errorMessage}`, {
                    id: toastId,
                });
                throw error;
            }
        },
    });

    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: async () => {
            const toastId = toast.loading("Deleting file...");
            try {
                const message = await removeTorrent(client, file.id);
                toast.success(message || "File deleted", { id: toastId });
                return message;
            } catch (error: unknown) {
                const errorMessage = error instanceof Error ? error.message : "Unknown error";
                toast.error(`Failed to delete: ${errorMessage}`, {
                    id: toastId,
                });
                throw error;
            }
        },
    });

    // Retry mutation (only for failed files)
    const retryMutation = useMutation({
        mutationFn: async () => {
            const toastId = toast.loading("Retrying file...");
            try {
                const result = await retryFiles(client, [file.id]);
                const message = result[file.id] || "Retry initiated";
                toast.success(message, { id: toastId });
                return message;
            } catch (error: unknown) {
                const errorMessage = error instanceof Error ? error.message : "Unknown error";
                toast.error(`Failed to retry: ${errorMessage}`, {
                    id: toastId,
                });
                throw error;
            }
        },
    });

    const isAnyActionPending =
        copyMutation.isPending ||
        downloadMutation.isPending ||
        playlistMutation.isPending ||
        deleteMutation.isPending ||
        retryMutation.isPending;

    return (
        <ContextMenu>
            <ContextMenuTrigger className={className} asChild>
                {children}
            </ContextMenuTrigger>
            <ContextMenuContent className="w-56">
                {file.status === "completed" && (
                    <Fragment>
                        <ContextMenuItem
                            className="cursor-pointer"
                            onClick={() => copyMutation.mutate()}
                            disabled={isAnyActionPending}>
                            {copyMutation.isPending ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Copy className="mr-2 h-4 w-4" />
                            )}
                            Copy Links
                        </ContextMenuItem>
                        <ContextMenuItem
                            className="cursor-pointer"
                            onClick={() => downloadMutation.mutate()}
                            disabled={isAnyActionPending}>
                            {downloadMutation.isPending ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Download className="mr-2 h-4 w-4" />
                            )}
                            Download
                        </ContextMenuItem>
                        <ContextMenuItem
                            className="cursor-pointer"
                            onClick={() => playlistMutation.mutate()}
                            disabled={isAnyActionPending}>
                            {playlistMutation.isPending ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <List className="mr-2 h-4 w-4" />
                            )}
                            Download Playlist
                        </ContextMenuItem>
                        <ContextMenuSeparator />
                    </Fragment>
                )}
                {file.status === "failed" && (
                    <ContextMenuItem
                        className="cursor-pointer"
                        onClick={() => retryMutation.mutate()}
                        disabled={isAnyActionPending}>
                        {retryMutation.isPending ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <RotateCw className="mr-2 h-4 w-4" />
                        )}
                        Retry
                    </ContextMenuItem>
                )}
                <ContextMenuItem
                    onClick={() => deleteMutation.mutate()}
                    disabled={isAnyActionPending}
                    className="cursor-pointer text-destructive focus:text-destructive">
                    {deleteMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Trash2 className="mr-2 h-4 w-4" />
                    )}
                    Delete
                </ContextMenuItem>
            </ContextMenuContent>
        </ContextMenu>
    );
}
