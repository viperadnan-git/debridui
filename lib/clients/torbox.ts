import {
    DebridFile,
    DebridFileStatus,
    DebridNode,
    DebridFileNode,
    DebridLinkInfo,
    DebridFileList,
    DebridFileAddStatus,
    OperationResult,
    AccountType,
    User,
    DebridAuthError,
    DebridError,
    DebridRateLimitError,
    WebDownload,
    WebDownloadAddResult,
    WebDownloadStatus,
    WebDownloadList,
} from "@/lib/types";
import BaseClient from "./base";
import { USER_AGENT } from "../constants";
import { getProxyUrl } from "@/lib/utils";

// TorBox Search API types
export interface TorBoxSearchResult {
    hash: string;
    raw_title: string;
    title: string;
    magnet: string;
    last_known_seeders: number;
    last_known_peers: number;
    size: number;
    files: number;
    type: string;
    age: string;
    cached: boolean;
}

interface TorBoxSearchResponse {
    success: boolean;
    message: string;
    data: {
        metadata: null;
        torrents: TorBoxSearchResult[];
    };
}

// TorBox API Response types
interface TorBoxUser {
    id: number;
    created_at: string;
    updated_at: string;
    email: string;
    plan: number;
    total_downloaded: number;
    customer_id: string;
    premium_expires_at?: string;
    cooldown_until?: string;
    auth_id: string;
    user_referral?: string;
    server: number;
    is_subscribed: boolean;
}

interface TorBoxTorrent {
    id: number;
    hash: string;
    created_at: string;
    updated_at: string;
    magnet: string;
    size: number;
    active: boolean;
    name: string;
    progress: number;
    download_state: string;
    seeds: number;
    peers: number;
    download_speed: number;
    upload_speed: number;
    eta: number;
    server: number;
    inactive_check: number;
    cached: boolean;
    expires_at: string;
    download_present: boolean;
    download_finished: boolean;
    auth_id: string;
    files?: TorBoxFile[];
    cached_at?: string;
}

interface TorBoxFile {
    id: number;
    name: string;
    size: number;
    mimetype?: string;
    md5?: string;
    s3_path?: string;
    short_name?: string;
}

interface TorBoxResponse<T> {
    success: boolean;
    error?: string;
    detail?: string;
    data?: T;
}

interface TorBoxWebDownload {
    id: number;
    hash: string;
    created_at: string;
    updated_at: string;
    name: string;
    size: number;
    download_state: string;
    progress: number;
    download_speed: number;
    eta: number;
    server: number;
    download_present: boolean;
    download_finished: boolean;
    download_url: string;
    original_url: string;
    auth_id: string;
    error?: string;
}

export default class TorBoxClient extends BaseClient {
    private readonly baseUrl = getProxyUrl("https://api.torbox.app/v1/api");
    private readonly apiBaseUrl = "https://api.torbox.app/v1/api";

    // TorBox downloads on server, needs refresh for progress
    readonly refreshInterval = 5000;
    readonly supportsEphemeralLinks = false;

    constructor(user: User) {
        super({ user });
    }

    /**
     * Build a download URL for torrents or web downloads
     */
    private buildDownloadUrl(
        type: "torrent" | "webdl",
        id: string | number,
        fileId: string | number,
        redirect: boolean = true
    ): string {
        const endpoint = type === "torrent" ? "torrents/requestdl" : "webdl/requestdl";
        const idParam = type === "torrent" ? "torrent_id" : "web_id";
        return `${this.apiBaseUrl}/${endpoint}?token=${this.user.apiKey}&${idParam}=${id}&file_id=${fileId}&redirect=${redirect}`;
    }

    private async makeRequest<T>(
        path: string,
        options: RequestInit & { returnRaw?: boolean } = { returnRaw: false }
    ): Promise<T> {
        await this.rateLimiter.acquire();
        const { apiKey } = this.user;
        const url = `${this.baseUrl}${encodeURIComponent(`/${path}`)}`;

        const response = await fetch(url, {
            ...options,
            headers: {
                Authorization: `Bearer ${apiKey}`,
                "User-Agent": USER_AGENT,
                ...options.headers,
            },
        });

        const data = await TorBoxClient.validateResponse<T>(response);
        return (options.returnRaw ? data : data.data) as T;
    }

    static async getUser(apiKey: string): Promise<User> {
        const response = await fetch(getProxyUrl("https://api.torbox.app/v1/api/user/me"), {
            headers: {
                Authorization: `Bearer ${apiKey}`,
                "User-Agent": USER_AGENT,
            },
        });

        const data = await TorBoxClient.validateResponse<TorBoxUser>(response);

        if (!data.data) {
            throw new DebridError("No user data returned", AccountType.TORBOX);
        }

        const user = data.data;
        const premiumExpiry = user.premium_expires_at ? new Date(user.premium_expires_at) : new Date();
        const isPremium = user.is_subscribed && premiumExpiry > new Date();

        return {
            id: `${AccountType.TORBOX}:${user.email}`,
            apiKey,
            type: AccountType.TORBOX,
            name: user.email,
            email: user.email,
            language: "en", // Default language
            isPremium,
            premiumExpiresAt: premiumExpiry,
        };
    }

    static async getAuthPin(): Promise<{
        pin: string;
        check: string;
        redirect_url: string;
    }> {
        // TorBox doesn't use PIN authentication like AllDebrid
        // For now, we'll return a placeholder that indicates to use API key directly
        return {
            pin: "TORBOX_API_KEY",
            check: "direct_api_key",
            redirect_url: "https://torbox.app/settings?section=account",
        };
    }

    static async validateAuthPin(pin: string, check: string): Promise<{ success: boolean; apiKey?: string }> {
        // Since TorBox uses direct API key authentication, we treat the "pin" as the API key
        if (check === "direct_api_key") {
            try {
                await this.getUser(pin);
                return {
                    success: true,
                    apiKey: pin,
                };
            } catch {
                return { success: false };
            }
        }
        return { success: false };
    }

    async getTorrentList({
        offset = 0,
        limit = 20,
        bypass_cache = true,
    }: {
        offset?: number;
        limit?: number;
        bypass_cache?: boolean;
    } = {}): Promise<DebridFileList> {
        const data = await this.makeRequest<TorBoxTorrent[]>(
            `torrents/mylist?bypass_cache=${bypass_cache}&offset=${offset}&limit=${limit}&files=true`
        );

        const paginatedTorrents = Array.isArray(data) ? data : [];

        const files: DebridFile[] = paginatedTorrents.map((torrent) => this.mapToDebridFile(torrent));

        return {
            files,
            offset,
            limit,
            hasMore: limit == paginatedTorrents.length,
        };
    }

    async findTorrents(searchQuery: string): Promise<DebridFile[]> {
        // Optimized paginated search with early exit - reduces memory from 1000 items to 100-200 items
        if (!searchQuery.trim()) {
            return (await this.getTorrentList({ limit: 100 })).files;
        }

        const results: DebridFile[] = [];
        let offset = 0;
        const limit = 100;
        const maxResults = 100;

        while (results.length < maxResults) {
            const { files, hasMore } = await this.getTorrentList({ offset, limit });
            const matches = files.filter((file) => file.name.toLowerCase().includes(searchQuery.toLowerCase()));
            results.push(...matches);

            if (!hasMore || results.length >= maxResults) {
                break;
            }
            offset += limit;
        }

        return results.slice(0, maxResults);
    }

    async findTorrentById(torrentId: string): Promise<DebridFile | null> {
        try {
            const torrent = await this.makeRequest<TorBoxTorrent>(`torrents/mylist?id=${torrentId}`);
            return this.mapToDebridFile(torrent);
        } catch {
            return null;
        }
    }

    async getDownloadLink({
        fileNode,
        resolve = false,
    }: {
        fileNode: DebridFileNode;
        resolve?: boolean;
    }): Promise<DebridLinkInfo> {
        const [torrentId, targetFileId] = fileNode.id.split(":");

        if (!torrentId || !targetFileId) {
            throw new DebridError("Invalid file ID format. Expected 'torrentId:fileId'", AccountType.TORBOX);
        }

        let downloadUrl: string;
        if (resolve) {
            downloadUrl = await this.getResolvedDownloadLink(torrentId, targetFileId);
        } else {
            downloadUrl = this.buildDownloadUrl("torrent", torrentId, targetFileId);
        }

        // Use file node's properties directly - no API call needed!
        return {
            link: downloadUrl,
            name: fileNode.name,
            size: fileNode.size || 0,
        };
    }

    private async getResolvedDownloadLink(torrentId: string, targetFileId: string): Promise<string> {
        return this.makeRequest<string>(
            `torrents/requestdl?token=${this.user.apiKey}&torrent_id=${torrentId}&file_id=${targetFileId}&redirect=false`,
            { method: "GET" }
        );
    }

    async getTorrentFiles(torrentId: string): Promise<DebridNode[]> {
        // For TorBox, files should already be available in DebridFile.files
        // This method exists only for backward compatibility
        // Make direct API request as fallback since this should rarely be called
        const torrent = await this.makeRequest<TorBoxTorrent>(`torrents/mylist?id=${torrentId}`);
        return this.mapToDebridFile(torrent).files || [];
    }

    async removeTorrent(torrentId: string): Promise<string> {
        const payload = {
            torrent_id: torrentId,
            operation: "delete",
        };

        await this.makeRequest<Record<string, unknown>>("torrents/controltorrent", {
            method: "POST",
            body: JSON.stringify(payload),
            headers: {
                "Content-Type": "application/json",
            },
        });

        return "Torrent removed successfully";
    }

    async restartTorrents(torrentIds: string[]): Promise<Record<string, OperationResult>> {
        const promises = torrentIds.map(async (torrentId) => {
            try {
                const payload = {
                    torrent_id: torrentId,
                    operation: "resume",
                };

                await this.makeRequest<Record<string, unknown>>("torrents/controltorrent", {
                    method: "POST",
                    body: JSON.stringify(payload),
                    headers: {
                        "Content-Type": "application/json",
                    },
                });

                return { torrentId, success: true, message: "Torrent restarted successfully" };
            } catch (error) {
                return {
                    torrentId,
                    success: false,
                    message: error instanceof Error ? error.message : "Failed to restart torrent",
                };
            }
        });

        const results = await Promise.allSettled(promises);

        return torrentIds.reduce(
            (acc, torrentId, index) => {
                const result = results[index];
                if (result.status === "fulfilled") {
                    acc[torrentId] = { success: result.value.success, message: result.value.message };
                } else {
                    acc[torrentId] = { success: false, message: result.reason?.message || "Failed to restart torrent" };
                }
                return acc;
            },
            {} as Record<string, OperationResult>
        );
    }

    async addMagnetLinks(magnetUris: string[]): Promise<Record<string, DebridFileAddStatus>> {
        // Parallelize magnet link additions for 10x faster bulk operations
        const promises = magnetUris.map(async (magnet) => {
            try {
                const formData = new FormData();
                formData.append("magnet", magnet);
                formData.append("seed", "0");
                formData.append("allow_zip", "true");

                const response = await this.makeRequest<{
                    data: { torrent_id?: number; hash?: string; auth_id?: string };
                    detail: string;
                }>("torrents/createtorrent", {
                    method: "POST",
                    body: formData,
                    returnRaw: true,
                });

                return {
                    magnet,
                    status: {
                        success: true,
                        id: response.data.torrent_id,
                        message: "Torrent added successfully",
                        is_cached: response.detail.toLowerCase().includes("cached"),
                    } as DebridFileAddStatus,
                };
            } catch (error) {
                return {
                    magnet,
                    status: {
                        success: false,
                        message: error instanceof Error ? error.message : "Failed to add torrent",
                        is_cached: false,
                    } as DebridFileAddStatus,
                };
            }
        });

        const results = await Promise.allSettled(promises);

        return magnetUris.reduce(
            (acc, magnet, index) => {
                const result = results[index];
                if (result.status === "fulfilled") {
                    acc[magnet] = result.value.status;
                } else {
                    acc[magnet] = {
                        success: false,
                        message: result.reason?.message || "Failed to add torrent",
                        is_cached: false,
                    };
                }
                return acc;
            },
            {} as Record<string, DebridFileAddStatus>
        );
    }

    async uploadTorrentFiles(files: File[]): Promise<Record<string, DebridFileAddStatus>> {
        // Parallelize torrent file uploads for 10x faster bulk operations
        const promises = files.map(async (file) => {
            try {
                const formData = new FormData();
                formData.append("file", file);
                formData.append("seed", "0");
                formData.append("allow_zip", "true");

                const response = await this.makeRequest<{ torrent_id?: number; id?: number; cached?: boolean }>(
                    "torrents/createtorrent",
                    {
                        method: "POST",
                        body: formData,
                    }
                );

                return {
                    fileName: file.name,
                    status: {
                        success: true,
                        id: response.torrent_id || response.id,
                        message: "Torrent file uploaded successfully",
                        is_cached: response.cached || false,
                    } as DebridFileAddStatus,
                };
            } catch (error) {
                return {
                    fileName: file.name,
                    status: {
                        success: false,
                        message: error instanceof Error ? error.message : "Failed to upload torrent file",
                        is_cached: false,
                    } as DebridFileAddStatus,
                };
            }
        });

        const results = await Promise.allSettled(promises);

        return files.reduce(
            (acc, file, index) => {
                const result = results[index];
                if (result.status === "fulfilled") {
                    acc[file.name] = result.value.status;
                } else {
                    acc[file.name] = {
                        success: false,
                        message: result.reason?.message || "Failed to upload torrent file",
                        is_cached: false,
                    };
                }
                return acc;
            },
            {} as Record<string, DebridFileAddStatus>
        );
    }

    async searchTorrents(query: string): Promise<TorBoxSearchResult[]> {
        // Use different base URL for search API (search-api.torbox.app vs api.torbox.app)
        const searchApiUrl = getProxyUrl(`https://search-api.torbox.app/torrents/search/${encodeURIComponent(query)}`);

        const params = new URLSearchParams({
            check_cache: "true",
            check_owned: "true",
            search_user_engines: "true",
        });

        const response = await fetch(`${searchApiUrl}?${params}`, {
            headers: {
                Authorization: `Bearer ${this.user.apiKey}`,
                "User-Agent": USER_AGENT,
            },
        });

        const data = await TorBoxClient.validateResponse<TorBoxSearchResponse["data"]>(response);
        return data.data?.torrents || [];
    }

    // Web download methods
    async addWebDownloads(links: string[]): Promise<WebDownloadAddResult[]> {
        const results = await Promise.allSettled(
            links.map(async (link) => {
                const formData = new FormData();
                formData.append("link", link);

                const response = await this.makeRequest<{
                    data: { webdownload_id?: number; hash?: string };
                    detail: string;
                }>("webdl/createwebdownload", {
                    method: "POST",
                    body: formData,
                    returnRaw: true,
                });

                return {
                    link,
                    success: true,
                    id: response.data.webdownload_id?.toString(),
                    name: link.split("/").pop() || link,
                };
            })
        );

        return results.map((result, index) => {
            if (result.status === "fulfilled") {
                return result.value;
            }
            return {
                link: links[index],
                success: false,
                error: result.reason?.message || "Failed to add link",
            };
        });
    }

    async getWebDownloadList({ offset, limit }: { offset: number; limit: number }): Promise<WebDownloadList> {
        const data = await this.makeRequest<TorBoxWebDownload[]>(`webdl/mylist?offset=${offset}&limit=${limit}`);
        const downloads = Array.isArray(data) ? data : [];

        return {
            downloads: downloads.map((dl) => this.mapToWebDownload(dl)),
            offset,
            limit,
            hasMore: downloads.length === limit,
        };
    }

    async deleteWebDownload(id: string): Promise<void> {
        await this.makeRequest("webdl/controlwebdownload", {
            method: "POST",
            body: JSON.stringify({ operation: "delete", webdl_id: parseInt(id) }),
            headers: {
                "Content-Type": "application/json",
            },
        });
    }

    private mapToWebDownload(dl: TorBoxWebDownload): WebDownload {
        const isReady = dl.download_finished && dl.download_present;
        const downloadLink = isReady ? this.buildDownloadUrl("webdl", dl.id, 0) : undefined;

        return {
            id: dl.id.toString(),
            name: dl.name,
            originalLink: dl.original_url,
            downloadLink,
            size: dl.size || undefined,
            status: this.mapWebDownloadStatus(dl.download_state, dl.download_finished),
            progress: dl.progress * 100,
            createdAt: new Date(dl.created_at),
            error: dl.error || undefined,
        };
    }

    private mapWebDownloadStatus(state: string, finished: boolean): WebDownloadStatus {
        if (finished) return "completed";
        const stateLower = state.toLowerCase();
        if (stateLower === "downloading" || stateLower === "metadl") return "processing";
        if (stateLower === "cached" || stateLower === "completed") return "completed";
        if (stateLower === "error" || stateLower === "failed") return "failed";
        if (stateLower === "pending" || stateLower === "queued") return "pending";
        return "processing";
    }

    private mapToDebridFile(torrent: TorBoxTorrent): DebridFile {
        const status: DebridFileStatus = this.mapTorrentStatus(torrent);

        // Map files if they exist in the torrent response
        const files: DebridFileNode[] | undefined = torrent.files
            ? torrent.files.map(
                  (file): DebridFileNode => ({
                      id: `${torrent.id}:${file.id}`,
                      name: file.short_name || file.name,
                      size: file.size,
                      type: "file",
                      children: [],
                  })
              )
            : undefined;

        return {
            id: torrent.id.toString(),
            name: torrent.name,
            size: Math.max(torrent.size, 0),
            status,
            progress: torrent.progress * 100,
            downloadSpeed: torrent.download_speed,
            uploadSpeed: torrent.upload_speed,
            peers: torrent.peers + torrent.seeds,
            createdAt: new Date(torrent.created_at),
            completedAt: torrent.cached_at ? new Date(torrent.cached_at) : undefined,
            files,
        };
    }

    private mapTorrentStatus(torrent: TorBoxTorrent): DebridFileStatus {
        const downloadState = torrent.download_state.toLowerCase();

        switch (downloadState) {
            case "downloading":
            case "metadl":
                return torrent.cached ? "completed" : "downloading";
            case "seeding":
            case "uploading":
            case "uploading (no peers)":
                if (torrent.active) {
                    return torrent.download_present ? "seeding" : "processing";
                } else {
                    return "completed";
                }
            case "cached":
            case "completed":
                return "completed";
            case "paused":
                return "paused";
            case "error":
            case "reported missing":
                return "failed";
            case "checking":
            case "stalled (no seeds)":
                return "waiting";
            case "processing":
                return "processing";
            case "expired":
                return "inactive";
            default:
                console.log("Unknown download state:", downloadState);
                return "unknown";
        }
    }

    private static async validateResponse<T>(response: Response): Promise<TorBoxResponse<T>> {
        let data: TorBoxResponse<T>;
        try {
            data = await response.json();
        } catch {
            if (!response.ok) {
                if (response.status === 401) {
                    throw new DebridAuthError("Invalid or expired API key", AccountType.TORBOX);
                }
                if (response.status === 429) {
                    const retryAfter = response.headers.get("Retry-After");
                    throw new DebridRateLimitError(
                        "Rate limit exceeded",
                        AccountType.TORBOX,
                        retryAfter ? parseInt(retryAfter) : undefined
                    );
                }
                throw new DebridError(`API request failed: ${response.statusText}`, AccountType.TORBOX);
            }
            throw new DebridError("Invalid JSON response", AccountType.TORBOX);
        }

        // API response errors (works for both ok and non-ok responses)
        if (!data.success) {
            const errorCode = data.error || "";
            const errorMessage = data.detail || "Unknown error";

            if (errorCode === "AUTH_ERROR" || errorMessage.toLowerCase().includes("token") || response.status === 401) {
                throw new DebridAuthError(errorMessage, AccountType.TORBOX);
            }

            if (
                errorCode === "RATE_LIMIT" ||
                errorMessage.toLowerCase().includes("rate limit") ||
                response.status === 429
            ) {
                const retryAfter = response.headers.get("Retry-After");
                throw new DebridRateLimitError(
                    errorMessage,
                    AccountType.TORBOX,
                    retryAfter ? parseInt(retryAfter) : undefined
                );
            }

            throw new DebridError(errorMessage, AccountType.TORBOX);
        }

        return data;
    }
}
