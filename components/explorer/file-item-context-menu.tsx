"use client";

import React, { Fragment } from "react";
import { Copy, Download, RotateCw, Trash2, List, Loader2 } from "lucide-react";
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuSeparator,
    ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { DebridFile } from "@/lib/types";
import { useAuthGuaranteed } from "@/components/auth/auth-provider";
import { downloadLinks, copyLinksToClipboard } from "@/lib/utils";
import { downloadM3UPlaylist, fetchTorrentDownloadLinks } from "@/lib/utils/file";
import { useToastMutation } from "@/lib/utils/mutation-factory";
import { removeTorrentWithCleanup, retryTorrentsWithCleanup } from "@/lib/utils/file-mutations";

interface FileItemContextMenuProps {
    file: DebridFile;
    children: React.ReactNode;
    className?: string;
}

export function FileItemContextMenu({ file, children, className }: FileItemContextMenuProps) {
    const { client, currentAccount } = useAuthGuaranteed();

    const copyMutation = useToastMutation(
        async () => {
            const links = await fetchTorrentDownloadLinks(file.id, client, currentAccount.id);
            copyLinksToClipboard(links);
            return links;
        },
        {
            loading: "Loading file links...",
            success: (links) => `${links.length} link(s) copied to clipboard`,
            error: "Failed to copy",
        }
    );

    const downloadMutation = useToastMutation(
        async () => {
            const links = await fetchTorrentDownloadLinks(file.id, client, currentAccount.id);
            downloadLinks(links);
            return links;
        },
        {
            loading: "Loading file links...",
            success: (links) => `Downloading ${links.length} file(s)`,
            error: "Failed to download",
        }
    );

    const playlistMutation = useToastMutation(
        async () => {
            const links = await fetchTorrentDownloadLinks(file.id, client, currentAccount.id);
            downloadM3UPlaylist(links, file.name);
            return links;
        },
        {
            loading: "Loading file links...",
            success: "Playlist downloaded",
            error: "Failed to download playlist",
        }
    );

    const deleteMutation = useToastMutation(
        async () => {
            const message = await removeTorrentWithCleanup(client, currentAccount.id, file.id);
            return message;
        },
        {
            loading: "Deleting file...",
            success: (message) => message || "File deleted",
            error: "Failed to delete",
        }
    );

    const retryMutation = useToastMutation(
        async () => {
            const result = await retryTorrentsWithCleanup(client, currentAccount.id, [file.id]);
            return result[file.id] || "Retry initiated";
        },
        {
            loading: "Retrying file...",
            success: (message) => message,
            error: "Failed to retry",
        }
    );

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
                            onClick={(e) => {
                                e.stopPropagation();
                                copyMutation.mutate();
                            }}
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
                            onClick={(e) => {
                                e.stopPropagation();
                                downloadMutation.mutate();
                            }}
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
                            onClick={(e) => {
                                e.stopPropagation();
                                playlistMutation.mutate();
                            }}
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
                        onClick={(e) => {
                            e.stopPropagation();
                            retryMutation.mutate();
                        }}
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
                    onClick={(e) => {
                        e.stopPropagation();
                        deleteMutation.mutate();
                    }}
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
