import {
    DebridFileNode,
    DebridLinkInfo,
    DebridFile,
    FileType,
} from "@/lib/types";
import { getFileType } from ".";
import { TRASH_SIZE_THRESHOLD } from "../constants";
import { format } from "date-fns";
import { queryClient } from "../query-client";
import { DebridClient } from "../clients";
import { useSettingsStore } from "../stores/settings";

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
export const sortFileNodesByPriority = (
    fileNodes: DebridFileNode[]
): DebridFileNode[] => {
    return [...fileNodes].sort((nodeA, nodeB) => {
        // Folders have highest priority
        if (nodeA.type === "folder" && nodeB.type !== "folder") return -1;
        if (nodeA.type !== "folder" && nodeB.type === "folder") return 1;

        // If both are folders, sort alphabetically
        if (nodeA.type === "folder" && nodeB.type === "folder") {
            return nodeA.name
                .toLowerCase()
                .localeCompare(nodeB.name.toLowerCase());
        }

        // For files, videos have priority over other file types
        const fileTypeA = getFileType(nodeA.name);
        const fileTypeB = getFileType(nodeB.name);

        if (fileTypeA === FileType.VIDEO && fileTypeB !== FileType.VIDEO)
            return -1;
        if (fileTypeA !== FileType.VIDEO && fileTypeB === FileType.VIDEO)
            return 1;

        // Same type or both non-videos - sort alphabetically
        return nodeA.name.toLowerCase().localeCompare(nodeB.name.toLowerCase());
    });
};

/**
 * Filters out small/trash files while preserving folders and media files
 */
export const filterTrashFiles = (
    fileNodes: DebridFileNode[]
): DebridFileNode[] => {
    return fileNodes.filter((fileNode) => {
        // Always preserve folders
        if (fileNode.type === "folder") return true;

        // Preserve files larger than threshold
        if (!fileNode.size || fileNode.size >= TRASH_SIZE_THRESHOLD)
            return true;

        // Preserve small media/document files
        const fileType = getFileType(fileNode.name);
        return PRESERVED_FILE_TYPES.has(fileType);
    });
};

/**
 * Processes file nodes with optional smart ordering and trash filtering
 */
export const processFileNodes = (
    fileNodes: DebridFileNode[]
): DebridFileNode[] => {
    let processedNodes = fileNodes;
    // Apply trash filtering if enabled
    if (useSettingsStore.getState().hideTrash) {
        processedNodes = filterTrashFiles(processedNodes);
    }

    // Apply smart ordering if enabled
    if (useSettingsStore.getState().smartOrder) {
        processedNodes = sortFileNodesByPriority(processedNodes);
    }

    // Recursively process child nodes
    return processedNodes.map((fileNode) => {
        if (fileNode.type === "folder" && fileNode.children?.length) {
            return {
                ...fileNode,
                children: processFileNodes(fileNode.children),
            };
        }
        return fileNode;
    });
};

/**
 * Downloads an M3U playlist file from debrid link nodes
 */
export const downloadM3UPlaylist = (linkNodes: DebridLinkInfo[]): void => {
    const timestamp = format(new Date(), "yyyy-MM-dd-HH-mm-ss");

    const playlistContent = [
        "#EXTM3U",
        "",
        ...linkNodes.map(
            (linkNode) => `#EXTINF:-1,${linkNode.name}\n${linkNode.link}`
        ),
    ].join("\n");

    const playlistBlob = new Blob([playlistContent], {
        type: "application/x-mpegurl",
    });
    const downloadUrl = URL.createObjectURL(playlistBlob);

    const downloadLink = document.createElement("a");
    downloadLink.href = downloadUrl;
    downloadLink.download = `Playlist-${timestamp}.m3u`;
    downloadLink.click();

    // Clean up the object URL
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
    const sortOption = SORT_OPTIONS.find(
        (option) => option.value === sortCriteria
    );
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
            return sortDirection === "desc"
                ? timestampB - timestampA
                : timestampA - timestampB;
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

/**
 * Cache key generator for download links
 */
const getDownloadLinkCacheKey = (userId: string, nodeId: string): string[] => [
    userId,
    "getDownloadLink",
    nodeId,
];

/**
 * Cache key generator for torrent files
 */
const getTorrentFilesCacheKey = (userId: string, fileId: string): string[] => [
    userId,
    "getTorrentFiles",
    fileId,
];

/**
 * Recursively collects download links from file nodes with caching
 */
export async function collectDownloadLinks(
    fileNodes: DebridFileNode[],
    debridClient: DebridClient,
    userId: string
): Promise<DebridLinkInfo[]> {
    const collectedLinks: DebridLinkInfo[] = [];

    const processFileNode = async (fileNode: DebridFileNode): Promise<void> => {
        if (fileNode.type === "file" && fileNode.id) {
            const cacheKey = getDownloadLinkCacheKey(userId, fileNode.id);

            // Try to get from cache first
            let linkInfo = queryClient.getQueryData(cacheKey) as
                | DebridLinkInfo
                | undefined;

            if (!linkInfo) {
                // Fetch from API if not cached
                linkInfo = await debridClient.getDownloadLink(fileNode.id);
                // Cache the result
                queryClient.setQueryData(cacheKey, linkInfo);
            }

            collectedLinks.push(linkInfo);
        }

        // Recursively process children
        if (fileNode.children?.length) {
            await Promise.all(fileNode.children.map(processFileNode));
        }
    };

    // Process all root nodes in parallel
    await Promise.all(fileNodes.map(processFileNode));

    return collectedLinks;
}

/**
 * Fetches all download links for a torrent with processing options
 */
export async function fetchTorrentDownloadLinks(
    torrentFileId: string,
    debridClient: DebridClient,
    userId: string
): Promise<DebridLinkInfo[]> {
    const torrentCacheKey = getTorrentFilesCacheKey(userId, torrentFileId);

    // Try to get torrent files from cache
    let torrentFileNodes = queryClient.getQueryData(torrentCacheKey) as
        | DebridFileNode[]
        | undefined;

    if (!torrentFileNodes) {
        // Fetch from API if not cached
        torrentFileNodes = await debridClient.getTorrentFiles(torrentFileId);
        queryClient.setQueryData(torrentCacheKey, torrentFileNodes);
    }

    // Process nodes with specified options
    const processedFileNodes = processFileNodes(torrentFileNodes);

    // Collect all download links
    const downloadLinks = await collectDownloadLinks(
        processedFileNodes,
        debridClient,
        userId
    );

    if (downloadLinks.length === 0) {
        throw new Error("No downloadable files found in torrent");
    }

    return downloadLinks;
}

/**
 * Fetches download links for multiple selected file IDs
 */
export async function fetchSelectedDownloadLinks(
    selectedFileIds: string[],
    debridClient: DebridClient,
    userId: string
): Promise<DebridLinkInfo[]> {
    if (selectedFileIds.length === 0) {
        return [];
    }

    const linkPromises = selectedFileIds.map(async (fileId) => {
        const cacheKey = getDownloadLinkCacheKey(userId, fileId);

        // Check cache first
        let linkInfo = queryClient.getQueryData(cacheKey) as
            | DebridLinkInfo
            | undefined;

        if (!linkInfo) {
            // Fetch from API if not cached
            linkInfo = await debridClient.getDownloadLink(fileId);
            queryClient.setQueryData(cacheKey, linkInfo);
        }

        return linkInfo;
    });

    const downloadLinks = await Promise.all(linkPromises);
    return downloadLinks.filter(Boolean); // Remove any null/undefined values
}
