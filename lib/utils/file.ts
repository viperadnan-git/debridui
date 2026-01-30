import { DebridNode, DebridFileNode, DebridLinkInfo, DebridFile, FileType } from "@/lib/types";
import { getFileType, chunkedPromise } from ".";
import { TRASH_SIZE_THRESHOLD } from "../constants";
import { format } from "date-fns";
import { queryClient } from "../query-client";
import { DebridClient } from "../clients";
import { useSettingsStore } from "../stores/settings";
import { getTorrentFilesCacheKey, getDownloadLinkCacheKey } from "./cache-keys";

export type SortOption = {
    value: string;
    label: string;
};

type SortOptionWithAccessor = SortOption & {
    accessor: (item: DebridFile) => string | number | Date;
};

export const SORT_OPTIONS: SortOptionWithAccessor[] = [
    { value: "date", label: "Date Added", accessor: (f) => f.createdAt },
    { value: "name", label: "Name", accessor: (f) => f.name.toLowerCase() },
    { value: "size", label: "Size", accessor: (f) => f.size },
    { value: "status", label: "Status", accessor: (f) => f.status },
    { value: "progress", label: "Progress", accessor: (f) => f.progress || 0 },
    { value: "downloaded", label: "Downloaded", accessor: (f) => f.downloaded || 0 },
    { value: "downloadSpeed", label: "Download Speed", accessor: (f) => f.downloadSpeed || 0 },
] as const;

// Media file types preserved even when small
const PRESERVED_FILE_TYPES = new Set([
    FileType.VIDEO,
    FileType.AUDIO,
    FileType.IMAGE,
    FileType.ARCHIVE,
    FileType.DOCUMENT,
]);

/** Sorts file nodes: folders first, videos second, then alphabetically */
const sortFileNodesByPriority = (fileNodes: DebridNode[]): DebridNode[] => {
    return [...fileNodes].sort((a, b) => {
        // Folders first
        if (a.type === "folder" && b.type !== "folder") return -1;
        if (a.type !== "folder" && b.type === "folder") return 1;

        // Videos second (only for files)
        if (a.type === "file" && b.type === "file") {
            const aIsVideo = getFileType(a.name) === FileType.VIDEO;
            const bIsVideo = getFileType(b.name) === FileType.VIDEO;
            if (aIsVideo && !bIsVideo) return -1;
            if (!aIsVideo && bIsVideo) return 1;
        }

        // Alphabetical
        return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
    });
};

/** Filters out small/trash files while preserving folders and media files */
const filterTrashFiles = (fileNodes: DebridNode[]): DebridNode[] => {
    return fileNodes.filter((node) => {
        if (node.type === "folder") return true;
        if (!node.size || node.size >= TRASH_SIZE_THRESHOLD) return true;
        return PRESERVED_FILE_TYPES.has(getFileType(node.name));
    });
};

/** Processes file nodes with optional smart ordering and trash filtering */
export const processFileNodes = ({
    fileNodes,
    hideTrash,
    smartOrder,
}: {
    fileNodes: DebridNode[];
    hideTrash?: boolean;
    smartOrder?: boolean;
}): DebridNode[] => {
    // Only read store if params not explicitly provided
    const settings = useSettingsStore.getState();
    const shouldHideTrash = hideTrash ?? settings.get("hideTrash");
    const shouldSmartOrder = smartOrder ?? settings.get("smartOrder");

    if (!shouldHideTrash && !shouldSmartOrder) return fileNodes;

    let result = fileNodes;
    if (shouldHideTrash) result = filterTrashFiles(result);
    if (shouldSmartOrder) result = sortFileNodesByPriority(result);

    // Recursively process children
    return result.map((node) =>
        node.type === "folder" && node.children?.length
            ? { ...node, children: processFileNodes({ fileNodes: node.children, hideTrash, smartOrder }) }
            : node
    );
};

/** Recursively collect all file node IDs from a tree in depth-first order */
export function collectNodeIds(nodes: DebridNode | DebridNode[]): string[] {
    const result: string[] = [];
    const collect = (list: DebridNode[]) => {
        for (const node of list) {
            if (node.type === "file" && node.id) result.push(node.id);
            if (node.children?.length) collect(node.children);
        }
    };
    collect(Array.isArray(nodes) ? nodes : [nodes]);
    return result;
}

/** Downloads an M3U8 playlist file (video files only) */
export const downloadM3UPlaylist = (linkNodes: DebridLinkInfo[], playlistName?: string): void => {
    const videoLinks = linkNodes.filter((n) => getFileType(n.name) === FileType.VIDEO);
    if (videoLinks.length === 0) {
        throw new Error("No video files found. M3U8 playlists can only be generated for video files.");
    }

    const filename = playlistName || `Playlist-${format(new Date(), "yyyy-MM-dd-HH-mm-ss")}`;
    const content = ["#EXTM3U", "", ...videoLinks.map((n) => `#EXTINF:-1,${n.name}\n${n.link}`)].join("\n");

    const url = URL.createObjectURL(new Blob([content], { type: "application/vnd.apple.mpegurl" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${filename}.m3u8`;
    link.click();
    URL.revokeObjectURL(url);
};

/** Sorts torrents based on specified criteria and order */
export const sortTorrentFiles = (files: DebridFile[], criteria: string, direction: "asc" | "desc"): DebridFile[] => {
    const option = SORT_OPTIONS.find((o) => o.value === criteria);
    if (!option) {
        console.warn(`Invalid sort criteria: ${criteria}`);
        return files;
    }

    const dir = direction === "desc" ? -1 : 1;
    return [...files].sort((a, b) => {
        const valA = option.accessor(a);
        const valB = option.accessor(b);

        if (valA instanceof Date || valB instanceof Date) {
            return dir * (new Date(valA).getTime() - new Date(valB).getTime());
        }
        if (typeof valA === "number" && typeof valB === "number") {
            return dir * (valA - valB);
        }
        return dir * String(valA).localeCompare(String(valB));
    });
};

/** Gets torrent files from cache or fetches them */
const getTorrentFilesWithCache = async (
    fileId: string,
    client: DebridClient,
    accountId: string,
    files?: DebridNode[]
): Promise<DebridNode[]> => {
    const cacheKey = getTorrentFilesCacheKey(accountId, fileId);

    if (files) {
        queryClient.setQueryData(cacheKey, files);
        return files;
    }

    let cached = queryClient.getQueryData<DebridNode[]>(cacheKey);
    if (!cached) {
        cached = await client.getTorrentFiles(fileId);
        queryClient.setQueryData(cacheKey, cached);
    }
    return cached;
};

/** Gets download link from cache or fetches it */
const getDownloadLinkWithCache = async (
    fileNode: DebridFileNode,
    client: DebridClient,
    accountId: string
): Promise<DebridLinkInfo> => {
    const cacheKey = getDownloadLinkCacheKey(accountId, fileNode.id);
    let cached = queryClient.getQueryData<DebridLinkInfo>(cacheKey);

    if (!cached) {
        cached = await client.getDownloadLink({ fileNode });
        queryClient.setQueryData(cacheKey, cached);
    }
    return cached;
};

/** Recursively collects download links from file nodes with caching */
async function collectDownloadLinks(
    fileNodes: DebridNode[],
    client: DebridClient,
    accountId: string
): Promise<DebridLinkInfo[]> {
    const links: DebridLinkInfo[] = [];

    const collect = async (node: DebridNode): Promise<void> => {
        if (node.type === "file") {
            links.push(await getDownloadLinkWithCache(node, client, accountId));
        }
        if (node.children?.length) {
            await chunkedPromise({
                promises: node.children.map((child) => () => collect(child)),
                chunkSize: 10,
                delay: 1500,
            });
        }
    };

    await chunkedPromise({
        promises: fileNodes.map((node) => () => collect(node)),
        chunkSize: 10,
        delay: 1500,
    });

    return links;
}

/** Fetches all download links for a torrent */
export async function fetchTorrentDownloadLinks(
    torrentFileId: string,
    client: DebridClient,
    accountId: string
): Promise<DebridLinkInfo[]> {
    const nodes = await getTorrentFilesWithCache(torrentFileId, client, accountId);
    const processed = processFileNodes({ fileNodes: nodes });
    const links = await collectDownloadLinks(processed, client, accountId);

    if (links.length === 0) {
        throw new Error("No downloadable files found in torrent");
    }
    return links;
}

/** Fetches download links for selected file IDs using metadata lookup */
export async function fetchSelectedDownloadLinks(
    selectedFileIds: string[],
    client: DebridClient,
    accountId: string
): Promise<DebridLinkInfo[]> {
    if (selectedFileIds.length === 0) return [];

    const { useSelectionStore } = await import("../stores/selection");
    const getNodeMetadata = useSelectionStore.getState().getNodeMetadata;

    const results = await chunkedPromise({
        promises: selectedFileIds.map((fileId) => async () => {
            const metadata = getNodeMetadata(fileId);
            if (!metadata) throw new Error(`No metadata found for file ID: ${fileId}`);

            return getDownloadLinkWithCache({ ...metadata, type: "file", children: [] }, client, accountId);
        }),
        chunkSize: 10,
        delay: 1500,
    });

    return results.filter(Boolean);
}
