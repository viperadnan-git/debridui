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
import { useFileLinkActions, useFileMutationActions } from "@/hooks/use-file-actions";

interface FileItemContextMenuProps {
    file: DebridFile;
    children: React.ReactNode;
    className?: string;
}

export function FileItemContextMenu({ file, children, className }: FileItemContextMenuProps) {
    const { copyMutation, downloadMutation, playlistMutation } = useFileLinkActions(file.id, { fileName: file.name });
    const { deleteMutation, retryMutation } = useFileMutationActions();

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
                            retryMutation.mutate([file.id]);
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
                        deleteMutation.mutate([file.id]);
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
