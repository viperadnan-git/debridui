import { useAuthGuaranteed } from "@/components/auth/auth-provider";
import { downloadLinks, copyLinksToClipboard } from "@/lib/utils";
import { downloadM3UPlaylist, fetchSelectedDownloadLinks, fetchTorrentDownloadLinks } from "@/lib/utils/file";
import { useToastMutation } from "@/lib/utils/mutation-factory";
import { DebridClient } from "@/lib/clients";
import { queryClient } from "@/lib/query-client";
import { useSelectionStore } from "@/lib/stores/selection";
import { toast } from "sonner";

/**
 * Remove torrent and cleanup caches
 */
export async function removeTorrentWithCleanup(
    client: DebridClient,
    accountId: string,
    fileId: string
): Promise<string> {
    const message = await client.removeTorrent(fileId);
    useSelectionStore.getState().removeFileSelection(fileId);
    queryClient.invalidateQueries({ queryKey: [accountId, "getTorrentList"] });
    queryClient.invalidateQueries({ queryKey: [accountId, "findTorrents"] });
    return message;
}

/**
 * Retry failed torrents and cleanup caches
 */
export async function retryTorrentsWithCleanup(client: DebridClient, accountId: string, fileIds: string[]) {
    const results = await client.restartTorrents(fileIds);
    queryClient.invalidateQueries({ queryKey: [accountId, "getTorrentList"] });
    queryClient.invalidateQueries({ queryKey: [accountId, "findTorrents"] });
    return results;
}

/**
 * Hook for file link actions (copy, download, playlist)
 */
export function useFileLinkActions(fileIds: string | string[], options?: { fileName?: string }) {
    const { client, currentAccount } = useAuthGuaranteed();
    const ids = Array.isArray(fileIds) ? fileIds : [fileIds];

    const fetchLinks = async () => {
        if (Array.isArray(fileIds)) {
            return fetchSelectedDownloadLinks(ids, client, currentAccount.id);
        }
        return fetchTorrentDownloadLinks(fileIds, client, currentAccount.id);
    };

    const copyMutation = useToastMutation(
        async () => {
            const links = await fetchLinks();
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
            const links = await fetchLinks();
            downloadLinks(links);
            return links;
        },
        {
            loading: "Loading links...",
            success: (links) => `Downloading ${links.length} file(s)`,
            error: "Failed to download",
        }
    );

    const playlistMutation = useToastMutation(
        async () => {
            const links = await fetchLinks();
            downloadM3UPlaylist(links, options?.fileName);
            return links;
        },
        {
            loading: "Loading links...",
            success: "Playlist downloaded",
            error: "Failed to create playlist",
        }
    );

    return { copyMutation, downloadMutation, playlistMutation };
}

/**
 * Hook for file mutation actions (delete, retry)
 */
export function useFileMutationActions() {
    const { client, currentAccount } = useAuthGuaranteed();

    const deleteMutation = useToastMutation(
        async (fileIds: string[]) => {
            const result = { success: 0, error: 0 };
            for (const id of fileIds) {
                try {
                    await removeTorrentWithCleanup(client, currentAccount.id, id);
                    result.success++;
                } catch (error) {
                    toast.error(
                        `Failed to delete file ${id}: ${error instanceof Error ? error.message : "Unknown error"}`
                    );
                    result.error++;
                }
            }
            return result;
        },
        {
            loading: "Deleting files...",
            success: (result) =>
                result.error > 0
                    ? `Deleted ${result.success} file(s), failed to delete ${result.error}`
                    : `Deleted ${result.success} file(s)`,
            error: "Failed to delete",
        }
    );

    const retryMutation = useToastMutation(
        async (fileIds: string[]) => {
            const results = await retryTorrentsWithCleanup(client, currentAccount.id, fileIds);
            let success = 0;
            for (const r of Object.values(results)) {
                if (r.success) success++;
                else toast.error(r.message);
            }
            return { success };
        },
        {
            loading: "Retrying files...",
            success: ({ success }) => (success > 0 ? `Retrying ${success} file(s)` : ""),
            error: "Failed to retry",
        }
    );

    return { deleteMutation, retryMutation };
}
