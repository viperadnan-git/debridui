"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Download, Loader2 } from "lucide-react";
import { useAuthGuaranteed } from "@/components/auth/auth-provider";
import { downloadLinks, copyLinksToClipboard } from "@/lib/utils";
import { downloadM3UPlaylist, fetchSelectedDownloadLinks } from "@/lib/utils/file";
import { useToastMutation } from "@/lib/utils/mutation-factory";

interface FileActionsProps {
    selectedFiles: Set<string>;
}

export function FileActions({ selectedFiles }: FileActionsProps) {
    const { client, currentAccount } = useAuthGuaranteed();
    const fileIds = useMemo(() => Array.from(selectedFiles), [selectedFiles]);
    const selectedCount = selectedFiles.size;
    const isDisabled = selectedCount === 0;

    const copyMutation = useToastMutation(
        async () => {
            const links = await fetchSelectedDownloadLinks(fileIds, client, currentAccount.id);
            copyLinksToClipboard(links);
            return links;
        },
        {
            loading: "Loading links...",
            success: (links) => `${links.length} link(s) copied to clipboard`,
            error: "Failed to copy",
        }
    );

    const downloadMutation = useToastMutation(
        async () => {
            const links = await fetchSelectedDownloadLinks(fileIds, client, currentAccount.id);
            downloadLinks(links);
            return links;
        },
        {
            loading: "Loading links...",
            success: (links) => `Downloading ${links.length} files`,
            error: "Failed to download",
        }
    );

    const playMutation = useToastMutation(
        async () => {
            const links = await fetchSelectedDownloadLinks(fileIds, client, currentAccount.id);
            downloadM3UPlaylist(links);
            return links;
        },
        {
            loading: "Loading links...",
            success: "Playlist downloaded",
            error: "Failed to create playlist",
        }
    );

    return (
        <div className="contents">
            <Button
                variant="outline"
                size="sm"
                disabled={isDisabled || copyMutation.isPending}
                onClick={() => copyMutation.mutate()}
                className="text-xs sm:text-sm">
                {copyMutation.isPending ? (
                    <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 animate-spin" />
                ) : (
                    <Copy className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                )}
                Copy ({selectedCount})
            </Button>
            <Button
                variant="outline"
                size="sm"
                disabled={isDisabled || downloadMutation.isPending}
                onClick={() => downloadMutation.mutate()}
                className="text-xs sm:text-sm">
                {downloadMutation.isPending ? (
                    <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 animate-spin" />
                ) : (
                    <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                )}
                Download ({selectedCount})
            </Button>
            <Button
                variant="outline"
                size="sm"
                disabled={isDisabled || playMutation.isPending}
                onClick={() => playMutation.mutate()}
                className="text-xs sm:text-sm">
                {playMutation.isPending ? (
                    <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 animate-spin" />
                ) : (
                    <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                )}
                Playlist ({selectedCount})
            </Button>
        </div>
    );
}
