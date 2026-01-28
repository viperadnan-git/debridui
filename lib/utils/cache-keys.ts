export const getDownloadLinkCacheKey = (
    accountId: string,
    nodeId: string,
    resolve: boolean = false
): (string | boolean)[] => [accountId, "getDownloadLink", nodeId, resolve];

export const getTorrentFilesCacheKey = (accountId: string, fileId: string): string[] => [
    accountId,
    "getTorrentFiles",
    fileId,
];

export const getFindTorrentsCacheKey = (accountId: string, query: string): string[] => [
    accountId,
    "findTorrents",
    query,
];
