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
    {
        value: "date",
        label: "Date Added",
        accessor: (file: DebridFile) => file.createdAt,
    },
    {
        value: "name",
        label: "Name",
        accessor: (file: DebridFile) => file.name.toLowerCase(),
    },
    {
        value: "size",
        label: "Size",
        accessor: (file: DebridFile) => file.size,
    },
    {
        value: "status",
        label: "Status",
        accessor: (file: DebridFile) => file.status,
    },
    {
        value: "progress",
        label: "Progress",
        accessor: (file: DebridFile) => file.progress || 0,
    },
    {
        value: "downloaded",
        label: "Downloaded",
        accessor: (file: DebridFile) => file.downloaded || 0,
    },
    {
        value: "downloadSpeed",
        label: "Download Speed",
        accessor: (file: DebridFile) => file.downloadSpeed || 0,
    },
] as const;

// Media file types that should be preserved even when small
const PRESERVED_FILE_TYPES = new Set([
    FileType.VIDEO,
    FileType.AUDIO,
    FileType.IMAGE,
    FileType.ARCHIVE,
    FileType.DOCUMENT,
]);

/**
 * Sorts file nodes with folders first, videos second, then alphabetically
 */
export const sortFileNodesByPriority = (fileNodes: DebridNode[]): DebridNode[] => {
    return [...fileNodes].sort((nodeA, nodeB) => {
        // Folders have highest priority
        if (nodeA.type === "folder" && nodeB.type !== "folder") return -1;
        if (nodeA.type !== "folder" && nodeB.type === "folder") return 1;

        // If both are folders, sort alphabetically
        if (nodeA.type === "folder" && nodeB.type === "folder") {
            return nodeA.name.toLowerCase().localeCompare(nodeB.name.toLowerCase());
        }

        // For files, videos have priority over other file types
        const fileTypeA = getFileType(nodeA.name);
        const fileTypeB = getFileType(nodeB.name);

        if (fileTypeA === FileType.VIDEO && fileTypeB !== FileType.VIDEO) return -1;
        if (fileTypeA !== FileType.VIDEO && fileTypeB === FileType.VIDEO) return 1;

        // Same type or both non-videos - sort alphabetically
        return nodeA.name.toLowerCase().localeCompare(nodeB.name.toLowerCase());
    });
};

/**
 * Filters out small/trash files while preserving folders and media files
 */
export const filterTrashFiles = (fileNodes: DebridNode[]): DebridNode[] => {
    return fileNodes.filter((fileNode) => {
        // Always preserve folders
        if (fileNode.type === "folder") return true;

        // Preserve files larger than threshold
        if (!fileNode.size || fileNode.size >= TRASH_SIZE_THRESHOLD) return true;

        // Preserve small media/document files
        const fileType = getFileType(fileNode.name);
        return PRESERVED_FILE_TYPES.has(fileType);
    });
};

/**
 * Processes file nodes with optional smart ordering and trash filtering
 */
export const processFileNodes = ({
    fileNodes,
    hideTrash,
    smartOrder,
}: {
    fileNodes: DebridNode[];
    hideTrash?: boolean;
    smartOrder?: boolean;
}): DebridNode[] => {
    let processedNodes = fileNodes;
    const shouldHideTrash = hideTrash || useSettingsStore.getState().get("hideTrash");
    const shouldSmartOrder = smartOrder || useSettingsStore.getState().get("smartOrder");

    if (!shouldHideTrash && !shouldSmartOrder) return processedNodes;

    if (shouldHideTrash) {
        processedNodes = filterTrashFiles(processedNodes);
    }

    if (shouldSmartOrder) {
        processedNodes = sortFileNodesByPriority(processedNodes);
    }

    // Recursively process child nodes
    return processedNodes.map((fileNode) => {
        if (fileNode.type === "folder" && fileNode.children?.length) {
            return {
                ...fileNode,
                children: processFileNodes({ fileNodes: fileNode.children, hideTrash, smartOrder }),
            };
        }
        return fileNode;
    });
};

/**
 * Downloads an M3U8 playlist file from debrid link nodes
 * Only includes video files in the playlist
 */
export const downloadM3UPlaylist = (linkNodes: DebridLinkInfo[], playlistName?: string): void => {
    // Filter to only include video files
    const videoLinks = linkNodes.filter((linkNode) => getFileType(linkNode.name) === FileType.VIDEO);

    if (videoLinks.length === 0) {
        throw new Error("No video files found. M3U8 playlists can only be generated for video files.");
    }

    const filename = playlistName || `Playlist-${format(new Date(), "yyyy-MM-dd-HH-mm-ss")}`;
    const playlistContent = [
        "#EXTM3U",
        "",
        ...videoLinks.map((linkNode) => `#EXTINF:-1,${linkNode.name}\n${linkNode.link}`),
    ].join("\n");

    const downloadUrl = URL.createObjectURL(new Blob([playlistContent], { type: "application/vnd.apple.mpegurl" }));

    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = `${filename}.m3u8`;
    link.click();
    URL.revokeObjectURL(downloadUrl);
};

/**
 * Sorts torrents based on specified criteria and order
 */
export const sortTorrentFiles = (
    torrentFiles: DebridFile[],
    sortCriteria: string,
    sortDirection: "asc" | "desc"
): DebridFile[] => {
    const sortOption = SORT_OPTIONS.find((option) => option.value === sortCriteria);
    if (!sortOption) {
        console.warn(`Invalid sort criteria: ${sortCriteria}`);
        return torrentFiles;
    }

    return [...torrentFiles].sort((fileA, fileB) => {
        const valueA = sortOption.accessor(fileA);
        const valueB = sortOption.accessor(fileB);

        if (valueA === valueB) return 0;

        // Special handling for date sorting
        if (sortCriteria === "date") {
            const timestampA = new Date(valueA).getTime();
            const timestampB = new Date(valueB).getTime();
            return sortDirection === "desc" ? timestampB - timestampA : timestampA - timestampB;
        }

        // Numeric comparison
        if (typeof valueA === "number" && typeof valueB === "number") {
            return sortDirection === "desc" ? valueB - valueA : valueA - valueB;
        }

        // String comparison
        const stringComparison = String(valueA).localeCompare(String(valueB));
        return sortDirection === "desc" ? -stringComparison : stringComparison;
    });
};

export const getTorrentFilesWithCache = async ({
    fileId,
    client,
    accountId,
    files,
}: {
    fileId: string;
    client: DebridClient;
    accountId: string;
    files?: DebridNode[];
}): Promise<DebridNode[]> => {
    // If files are already provided (e.g., from TorBox), use them
    if (files) {
        const cacheKey = getTorrentFilesCacheKey(accountId, fileId);
        queryClient.setQueryData(cacheKey, files);
        return files;
    }

    // Otherwise check cache or fetch
    const cacheKey = getTorrentFilesCacheKey(accountId, fileId);
    let node = queryClient.getQueryData<DebridNode[]>(cacheKey);

    if (!node) {
        node = await client.getTorrentFiles(fileId);
        queryClient.setQueryData(cacheKey, node);
    }

    return node;
};

export const getDownloadLinkWithCache = async ({
    fileNode,
    client,
    accountId,
}: {
    fileNode: DebridFileNode;
    client: DebridClient;
    accountId: string;
}): Promise<DebridLinkInfo> => {
    const cacheKey = getDownloadLinkCacheKey(accountId, fileNode.id);
    let linkInfo = queryClient.getQueryData<DebridLinkInfo>(cacheKey);

    if (!linkInfo) {
        linkInfo = await client.getDownloadLink({ fileNode });
        queryClient.setQueryData(cacheKey, linkInfo);
    }

    return linkInfo;
};

/**
 * Recursively collects download links from file nodes with caching
 */
export async function collectDownloadLinks(
    fileNodes: DebridNode[],
    debridClient: DebridClient,
    accountId: string
): Promise<DebridLinkInfo[]> {
    const collectedLinks: DebridLinkInfo[] = [];

    const collectFileNodeLinks = async (fileNode: DebridNode): Promise<void> => {
        if (fileNode.type === "file") {
            collectedLinks.push(await getDownloadLinkWithCache({ fileNode, client: debridClient, accountId }));
        }

        if (fileNode.children?.length) {
            await chunkedPromise({
                promises: fileNode.children.map((fileNode) => () => collectFileNodeLinks(fileNode)),
                chunkSize: 10,
                delay: 1500,
            });
        }
    };

    await chunkedPromise({
        promises: fileNodes.map((fileNode) => () => collectFileNodeLinks(fileNode)),
        chunkSize: 10,
        delay: 1500,
    });

    return collectedLinks;
}

/**
 * Fetches all download links for a torrent with processing options
 */
export async function fetchTorrentDownloadLinks(
    torrentFileId: string,
    debridClient: DebridClient,
    accountId: string
): Promise<DebridLinkInfo[]> {
    const torrentFileNodes = await getTorrentFilesWithCache({ fileId: torrentFileId, client: debridClient, accountId });
    // Process nodes with specified options
    const processedFileNodes = processFileNodes({ fileNodes: torrentFileNodes });
    // Collect all download links
    const downloadLinks = await collectDownloadLinks(processedFileNodes, debridClient, accountId);

    if (downloadLinks.length === 0) {
        throw new Error("No downloadable files found in torrent");
    }

    return downloadLinks;
}

/**
 * Fetches download links for multiple selected file IDs preserving the input order
 * Uses O(1) metadata lookup from selection store to construct file nodes
 */
export async function fetchSelectedDownloadLinks(
    selectedFileIds: string[],
    debridClient: DebridClient,
    accountId: string
): Promise<DebridLinkInfo[]> {
    if (selectedFileIds.length === 0) {
        return [];
    }

    const { useSelectionStore } = await import("../stores/selection");
    const getNodeMetadata = useSelectionStore.getState().getNodeMetadata;

    const results = await chunkedPromise({
        promises: selectedFileIds.map((fileId) => async () => {
            const metadata = getNodeMetadata(fileId);
            if (!metadata) {
                throw new Error(`No metadata found for file ID: ${fileId}`);
            }

            return getDownloadLinkWithCache({
                fileNode: { ...metadata, type: "file", children: [] },
                client: debridClient,
                accountId,
            });
        }),
        chunkSize: 10,
        delay: 1500,
    });

    return results.filter(Boolean);
}
