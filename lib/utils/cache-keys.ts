import { cache } from "react";

export const getDownloadLinkCacheKey = cache(
    (userId: string, nodeId: string, resolve: boolean = false): (string | boolean)[] => [
        userId,
        "getDownloadLink",
        nodeId,
        resolve,
    ]
);
export const getTorrentFilesCacheKey = cache((userId: string, fileId: string): string[] => [
    userId,
    "getTorrentFiles",
    fileId,
]);
export const getFindTorrentsCacheKey = cache((userId: string, query: string): string[] => [
    userId,
    "findTorrents",
    query,
]);
