import { toast } from "sonner";
import { useAuthGuaranteed } from "@/components/auth/auth-provider";
import type { DebridClient } from "@/lib/clients";
import { queryClient } from "@/lib/query-client";
import { useSelectionStore } from "@/lib/stores/selection";
import type { DebridFile } from "@/lib/types";
import { copyLinksToClipboard, downloadLinks } from "@/lib/utils";
import { getTorrentFilesCacheKey } from "@/lib/utils/cache-keys";
import { downloadM3UPlaylist, fetchSelectedDownloadLinks, fetchTorrentDownloadLinks } from "@/lib/utils/file";
import { useToastMutation } from "@/lib/utils/mutation-factory";

export function invalidateTorrentQueries(accountId: string) {
    for (const key of ["getTorrentList", "findTorrents", "findTorrentById"]) {
        queryClient.invalidateQueries({ queryKey: [accountId, key] });
    }
}

export async function removeTorrentWithCleanup(
    client: DebridClient,
    accountId: string,
    fileId: string
): Promise<string> {
    const message = await client.removeTorrent(fileId);
    useSelectionStore.getState().removeFileSelection(fileId);
    queryClient.removeQueries({ queryKey: getTorrentFilesCacheKey(accountId, fileId) });
    invalidateTorrentQueries(accountId);
    return message;
}

export async function retryTorrentsWithCleanup(client: DebridClient, accountId: string, fileIds: string[]) {
    const results = await client.restartTorrents(fileIds);
    invalidateTorrentQueries(accountId);
    return results;
}

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

    const airlockMutation = useToastMutation(
        async ({ fileIds, airlocked }: { fileIds: string[]; airlocked: boolean }) => {
            const result = { success: 0, error: 0, airlocked };
            for (const id of fileIds) {
                try {
                    await client.setAirlocked?.({ id, target: "torrent", airlocked });
                    result.success++;
                } catch (error) {
                    toast.error(
                        `Failed to update Airlock for ${id}: ${error instanceof Error ? error.message : "Unknown error"}`
                    );
                    result.error++;
                }
            }
            invalidateTorrentQueries(currentAccount.id);
            return result;
        },
        {
            loading: "Updating Airlock...",
            success: (result) =>
                result.success === 0
                    ? ""
                    : `${result.airlocked ? "Added" : "Removed"} ${result.success} file(s) ${result.airlocked ? "to" : "from"} Airlock`,
            error: "Failed to update Airlock",
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

    return { deleteMutation, retryMutation, airlockMutation, supportsAirlock: !!client.setAirlocked };
}

/** Airlock requires the item to be cached on the provider */
export function canAirlock(file: DebridFile): boolean {
    return file.status === "completed" || file.status === "seeding";
}
