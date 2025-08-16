"use client";

import { Button } from "@/components/ui/button";
import { Copy, Download, Play, Loader2 } from "lucide-react";
import { useMutation, useQueries, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuthContext } from "@/lib/contexts/auth";
import { DebridLinkInfo } from "@/lib/clients/types";
import { downloadLinks, copyLinksToClipboard } from "@/lib/utils";
import { QUERY_CACHE_MAX_AGE } from "@/lib/constants";

interface FileActionsProps {
    selectedFiles: Set<string>;
}

export function FileActions({ selectedFiles }: FileActionsProps) {
    const { client } = useAuthContext();
    const queryClient = useQueryClient();
    const fileIds = Array.from(selectedFiles);

    // Fetch link info for all selected files using the same cache strategy as FileActionButton
    const linkQueries = useQueries({
        queries: fileIds.map((id) => ({
            queryKey: ["getNodeDownloadUrl", id],
            queryFn: () => client.getNodeDownloadUrl(id),
            enabled: false, // Don't auto-fetch until action is clicked
            staleTime: QUERY_CACHE_MAX_AGE,
        })),
    });

    const fetchAllLinks = async (): Promise<DebridLinkInfo[]> => {
        const promises = fileIds.map(async (id, index) => {
            // Check if data is already cached
            const cached = queryClient.getQueryData<DebridLinkInfo>([
                "getNodeDownloadUrl",
                id,
            ]);
            if (cached) return cached;

            // Fetch if not cached
            const result = await linkQueries[index].refetch();
            return result.data as DebridLinkInfo;
        });

        const results = await Promise.all(promises);
        return results.filter(Boolean);
    };

    const copyMutation = useMutation({
        mutationFn: async () => {
            const links = await fetchAllLinks();
            copyLinksToClipboard(links);
            return links;
        },
        onSuccess: () => {
            toast.success("Links copied to clipboard");
        },
        onError: (error) => {
            toast.error(`Failed to copy: ${error.message}`);
        },
    });

    const downloadMutation = useMutation({
        mutationFn: async () => {
            const links = await fetchAllLinks();
            downloadLinks(links);
            return links;
        },
        onSuccess: (links) => {
            toast.success(`Downloading ${links.length} files`);
        },
        onError: (error) => {
            toast.error(`Failed to download: ${error.message}`);
        },
    });

    const playMutation = useMutation({
        mutationFn: async () => {
            toast.info("Not implemented");
        },
        onSuccess: () => {
            toast.success("Opening media player");
        },
        onError: (error) => {
            toast.error(`Failed to play: ${error.message}`);
        },
    });

    const isDisabled = selectedFiles.size === 0;

    return (
        <div className="flex gap-1 sm:gap-2">
            <Button
                variant="outline"
                size="sm"
                disabled={isDisabled || copyMutation.isPending}
                onClick={() => copyMutation.mutate()}
                className="text-xs sm:text-sm h-7 sm:h-8"
            >
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
                className="text-xs sm:text-sm h-7 sm:h-8"
            >
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
                className="text-xs sm:text-sm h-7 sm:h-8"
            >
                {playMutation.isPending ? (
                    <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 animate-spin" />
                ) : (
                    <Play className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                )}
                Play ({selectedFiles.size})
            </Button>
        </div>
    );
}
