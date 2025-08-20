export const getDownloadLinkCacheKey = (userId: string, nodeId: string): string[] => [
    userId,
    "getDownloadLink",
    nodeId,
];
export const getTorrentFilesCacheKey = (userId: string, fileId: string): string[] => [
    userId,
    "getTorrentFiles",
    fileId,
];
