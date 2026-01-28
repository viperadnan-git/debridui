import { DebridClient } from "@/lib/clients";
import { queryClient } from "@/lib/query-client";
import { useSelectionStore } from "@/lib/stores/selection";

/**
 * Remove torrent and cleanup caches
 */
export async function removeTorrentWithCleanup(
    client: DebridClient,
    accountId: string,
    fileId: string
): Promise<string> {
    const message = await client.removeTorrent(fileId);

    // Clear selection
    useSelectionStore.getState().removeFileSelection(fileId);

    // Invalidate caches
    queryClient.invalidateQueries({ queryKey: [accountId, "getTorrentList"] });
    queryClient.invalidateQueries({ queryKey: [accountId, "findTorrents"] });

    return message;
}

/**
 * Retry failed torrents and cleanup caches
 */
export async function retryTorrentsWithCleanup(
    client: DebridClient,
    accountId: string,
    fileIds: string[]
): Promise<Record<string, string>> {
    const result = await client.restartTorrents(fileIds);

    // Invalidate caches
    queryClient.invalidateQueries({ queryKey: [accountId, "getTorrentList"] });
    queryClient.invalidateQueries({ queryKey: [accountId, "findTorrents"] });

    return result;
}
