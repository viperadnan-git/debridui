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
    WebDownloadAddResult,
    WebDownloadList,
} from "@/lib/types";
import BaseClient from "./base";
import { USER_AGENT } from "../constants";
import { getProxyUrl } from "@/lib/utils";
import { queryClient } from "../query-client";

// Real-Debrid API response types
type TorrentStatus =
    | "magnet_error"
    | "magnet_conversion"
    | "waiting_files_selection"
    | "queued"
    | "downloading"
    | "downloaded"
    | "error"
    | "virus"
    | "compressing"
    | "uploading"
    | "dead";

interface RDTorrentListItem {
    id: string;
    filename: string;
    hash: string;
    bytes: number;
    host: string;
    split: number;
    progress: number;
    status: TorrentStatus;
    added: string;
    links: string[];
    ended?: string;
    speed?: number;
    seeders?: number;
}

interface RDTorrentInfo extends RDTorrentListItem {
    original_filename: string;
    original_bytes: number;
    files: RDTorrentFile[];
}

interface RDTorrentFile {
    id: number;
    path: string;
    bytes: number;
    selected: 0 | 1;
}

interface RDUnrestrictedLink {
    id: string;
    filename: string;
    mimeType: string | null;
    filesize: number;
    link: string;
    host: string;
    chunks: number;
    crc: number;
    download: string;
    streamable: number;
}

interface RDDownload {
    id: string;
    filename: string;
    mimeType: string | null;
    filesize: number;
    link: string;
    host: string;
    chunks: number;
    download: string;
    streamable: number;
    generated: string;
}

interface RDAddTorrentResponse {
    id: string;
    uri: string;
}

interface RDApiError {
    error: string;
    error_code?: number;
}

// Error codes that indicate auth issues
const AUTH_ERROR_CODES = new Set([8, 9, 10, 11, 12, 13, 14, 15]);

export default class RealDebridClient extends BaseClient {
    private readonly baseUrl = "https://api.real-debrid.com/rest/1.0";
    private static readonly FORM_HEADERS = { "Content-Type": "application/x-www-form-urlencoded" } as const;

    // Real-Debrid processes torrents server-side, needs polling
    // Write operations (add magnet/torrent/web download) are serialized one-by-one — parallel requests cause rate-limit errors
    readonly refreshInterval = 5000;
    readonly supportsEphemeralLinks = false;

    private readonly authHeaders: Record<string, string>;

    constructor(user: User) {
        super({ user, rateLimiter: { maxRequests: 250, intervalMs: 60000 } });
        this.authHeaders = {
            Authorization: `Bearer ${user.apiKey}`,
            "User-Agent": USER_AGENT,
        };
    }

    private async makeRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
        await this.rateLimiter.acquire();
        const url = getProxyUrl(`${this.baseUrl}/${path}`);

        const response = await fetch(url, {
            ...options,
            headers: {
                ...this.authHeaders,
                ...options.headers,
            },
        });

        return RealDebridClient.validateResponse<T>(response);
    }

    private static async validateResponse<T>(response: Response): Promise<T> {
        if (response.status === 204) {
            return undefined as T;
        }

        if (response.status === 429) {
            throw new DebridRateLimitError("Rate limit exceeded", AccountType.REALDEBRID);
        }

        let data: T | RDApiError;
        try {
            data = await response.json();
        } catch {
            if (!response.ok) {
                if (response.status === 401) {
                    throw new DebridAuthError("Invalid or expired API token", AccountType.REALDEBRID);
                }
                throw new DebridError(`API request failed: ${response.statusText}`, AccountType.REALDEBRID);
            }
            throw new DebridError("Invalid JSON response", AccountType.REALDEBRID);
        }

        // Check for error response
        if (data && typeof data === "object" && "error" in data) {
            const errorData = data as RDApiError;
            const errorCode = errorData.error_code;

            if (errorCode !== undefined && AUTH_ERROR_CODES.has(errorCode)) {
                throw new DebridAuthError(errorData.error, AccountType.REALDEBRID);
            }

            throw new DebridError(errorData.error, AccountType.REALDEBRID);
        }

        return data as T;
    }

    static async getUser(apiKey: string): Promise<User> {
        const url = getProxyUrl("https://api.real-debrid.com/rest/1.0/user");

        const response = await fetch(url, {
            headers: {
                Authorization: `Bearer ${apiKey}`,
                "User-Agent": USER_AGENT,
            },
        });

        const data = await RealDebridClient.validateResponse<{
            id: number;
            username: string;
            email: string;
            points: number;
            locale: string;
            avatar: string;
            type: "premium" | "free";
            premium: number;
            expiration: string;
        }>(response);

        const premiumExpiresAt = new Date(data.expiration);
        const isPremium = data.type === "premium" && premiumExpiresAt > new Date();

        return {
            id: `${AccountType.REALDEBRID}:${data.username}`,
            apiKey,
            type: AccountType.REALDEBRID,
            name: data.username,
            email: data.email,
            language: data.locale,
            isPremium,
            premiumExpiresAt,
        };
    }

    static async getAuthPin(): Promise<{
        pin: string;
        check: string;
        redirect_url: string;
    }> {
        // Real-Debrid uses direct API token authentication
        return {
            pin: "REALDEBRID_API_KEY",
            check: "direct_api_key",
            redirect_url: "https://real-debrid.com/apitoken",
        };
    }

    static async validateAuthPin(pin: string, check: string): Promise<{ success: boolean; apiKey?: string }> {
        if (check === "direct_api_key") {
            try {
                await this.getUser(pin);
                return { success: true, apiKey: pin };
            } catch {
                return { success: false };
            }
        }
        return { success: false };
    }

    async getTorrentList({
        offset = 0,
        limit = 20,
    }: {
        offset?: number;
        limit?: number;
    } = {}): Promise<DebridFileList> {
        // Real-Debrid returns 204 when offset param is present — use page-based pagination instead
        const page = Math.floor(offset / limit) + 1;
        const torrents = await this.makeRequest<RDTorrentListItem[]>(`torrents?page=${page}&limit=${limit}`);
        const files = torrents.map((t) => this.mapToDebridFile(t));

        return {
            files,
            offset,
            limit,
            // X-Total-Count header exists but is not exposed via CORS
            hasMore: torrents.length === limit,
        };
    }

    async findTorrents(searchQuery: string): Promise<DebridFile[]> {
        if (!searchQuery.trim()) {
            return (await this.getTorrentList({ limit: 100 })).files;
        }

        const results: DebridFile[] = [];
        let offset = 0;
        const limit = 100;
        const maxResults = 100;
        const query = searchQuery.toLowerCase();

        while (results.length < maxResults) {
            const { files, hasMore } = await this.getTorrentList({ offset, limit });
            const matches = files.filter((f) => f.name.toLowerCase().includes(query));
            results.push(...matches);

            if (!hasMore || results.length >= maxResults) break;
            offset += limit;
        }

        return results.slice(0, maxResults);
    }

    async findTorrentById(torrentId: string): Promise<DebridFile | null> {
        try {
            const torrent = await this.makeRequest<RDTorrentInfo>(`torrents/info/${torrentId}`);
            return this.mapToDebridFile(torrent);
        } catch {
            return null;
        }
    }

    async getDownloadLink({ fileNode }: { fileNode: DebridFileNode; resolve?: boolean }): Promise<DebridLinkInfo> {
        const result = await this.unrestrictLink(fileNode.id);

        return {
            link: result.download,
            name: result.filename || fileNode.name,
            size: result.filesize || fileNode.size || 0,
        };
    }

    async getTorrentFiles(torrentId: string): Promise<DebridNode[]> {
        const torrent = await this.makeRequest<RDTorrentInfo>(`torrents/info/${torrentId}`);

        return this.buildFileTree(torrent.files, torrent.links);
    }

    async removeTorrent(torrentId: string): Promise<string> {
        await this.makeRequest<void>(`torrents/delete/${torrentId}`, {
            method: "DELETE",
        });
        return "Torrent removed successfully";
    }

    async restartTorrents(torrentIds: string[]): Promise<Record<string, OperationResult>> {
        // Real-Debrid API does not support restarting torrents
        return Object.fromEntries(
            torrentIds.map((id) => [id, { success: false, message: "Restart not supported by Real-Debrid" }])
        );
    }

    async addMagnetLinks(magnetUris: string[]): Promise<Record<string, DebridFileAddStatus>> {
        const results: Record<string, DebridFileAddStatus> = {};

        for (const magnet of magnetUris) {
            try {
                const body = new URLSearchParams({ magnet });

                const result = await this.makeRequest<RDAddTorrentResponse>("torrents/addMagnet", {
                    method: "POST",
                    body: body.toString(),
                    headers: RealDebridClient.FORM_HEADERS,
                });

                await this.selectAllFiles(result.id);

                results[magnet] = {
                    success: true,
                    id: result.id,
                    message: `Successfully added torrent`,
                    is_cached: true,
                };
            } catch (error) {
                results[magnet] = {
                    success: false,
                    message: error instanceof Error ? error.message : "Failed to add torrent",
                    is_cached: false,
                };
            }
        }

        return results;
    }

    async uploadTorrentFiles(files: File[]): Promise<Record<string, DebridFileAddStatus>> {
        const results: Record<string, DebridFileAddStatus> = {};

        for (const file of files) {
            try {
                const arrayBuffer = await file.arrayBuffer();

                const result = await this.makeRequest<RDAddTorrentResponse>("torrents/addTorrent", {
                    method: "PUT",
                    body: arrayBuffer,
                    headers: { "Content-Type": "application/x-bittorrent" },
                });

                await this.selectAllFiles(result.id);

                results[file.name] = {
                    success: true,
                    id: result.id,
                    message: `Successfully uploaded: ${file.name}`,
                    is_cached: false,
                };
            } catch (error) {
                results[file.name] = {
                    success: false,
                    message: error instanceof Error ? error.message : "Failed to upload torrent file",
                    is_cached: false,
                };
            }
        }

        return results;
    }

    // Web download methods
    async addWebDownloads(links: string[]): Promise<WebDownloadAddResult[]> {
        const results: WebDownloadAddResult[] = [];

        for (const link of links) {
            try {
                // Try to expand folder links first
                const expandedLinks = await this.tryExpandFolder(link);

                // Unrestrict each link (single link or expanded folder contents)
                for (const singleLink of expandedLinks) {
                    try {
                        const result = await this.unrestrictLink(singleLink);
                        results.push({
                            link: singleLink,
                            success: true,
                            downloadLink: result.download,
                            name: result.filename,
                            size: result.filesize,
                            id: result.id,
                        });
                    } catch (error) {
                        results.push({
                            link: singleLink,
                            success: false,
                            error: error instanceof Error ? error.message : "Failed to unrestrict link",
                        });
                    }
                }
            } catch (error) {
                results.push({
                    link,
                    success: false,
                    error: error instanceof Error ? error.message : "Failed to process link",
                });
            }
        }

        return results;
    }

    private static readonly FOLDER_PATTERNS_KEY = ["realdebrid", "folderPatterns"] as const;
    private static compiledPatterns: RegExp[] | null = null;

    /**
     * Fetch and cache folder regex patterns from Real-Debrid API.
     * Pattern strings persist in IDB; compiled RegExp cached in memory.
     */
    private static async getFolderPatterns(): Promise<RegExp[]> {
        if (RealDebridClient.compiledPatterns) {
            return RealDebridClient.compiledPatterns;
        }

        try {
            const patterns = await queryClient.fetchQuery({
                queryKey: RealDebridClient.FOLDER_PATTERNS_KEY,
                queryFn: async () => {
                    const response = await fetch(getProxyUrl("https://api.real-debrid.com/rest/1.0/hosts/regexFolder"));
                    const rawPatterns: string[] = await response.json();

                    // Convert PHP-style regex "/pattern/" to pattern string for storage
                    // (RegExp objects can't be serialized to IDB)
                    return rawPatterns
                        .map((p) => p.match(/^\/(.+)\/$/)?.[1] ?? null)
                        .filter((p): p is string => p !== null);
                },
                staleTime: 24 * 60 * 60 * 1000, // 24 hours
            });

            // Compile and cache RegExp objects in memory
            RealDebridClient.compiledPatterns = patterns
                .map((p) => {
                    try {
                        return new RegExp(p, "i");
                    } catch {
                        return null;
                    }
                })
                .filter((r): r is RegExp => r !== null);
        } catch {
            // Fetch failed - return empty (all links treated as single files)
            RealDebridClient.compiledPatterns = [];
        }

        return RealDebridClient.compiledPatterns;
    }

    /**
     * Try to expand a folder link into individual file links.
     * Only calls the API if the link matches known folder patterns.
     * Returns [link] if not a folder or expansion fails.
     */
    private async tryExpandFolder(link: string): Promise<string[]> {
        const patterns = await RealDebridClient.getFolderPatterns();
        const isFolder = patterns.some((p) => p.test(link));

        if (!isFolder) {
            return [link];
        }

        try {
            const body = new URLSearchParams({ link });
            const folderLinks = await this.makeRequest<string[]>("unrestrict/folder", {
                method: "POST",
                body: body.toString(),
                headers: RealDebridClient.FORM_HEADERS,
            });

            if (Array.isArray(folderLinks) && folderLinks.length > 0) {
                return folderLinks;
            }
        } catch {
            // Folder expansion failed - treat as single link
        }

        return [link];
    }

    private async unrestrictLink(link: string): Promise<RDUnrestrictedLink> {
        const body = new URLSearchParams({ link });
        return this.makeRequest<RDUnrestrictedLink>("unrestrict/link", {
            method: "POST",
            body: body.toString(),
            headers: RealDebridClient.FORM_HEADERS,
        });
    }

    async getWebDownloadList({ offset, limit }: { offset: number; limit: number }): Promise<WebDownloadList> {
        // Real-Debrid uses page-based pagination
        const page = Math.floor(offset / limit) + 1;
        const downloads = await this.makeRequest<RDDownload[]>(`downloads?page=${page}&limit=${limit}`);

        return {
            downloads: downloads.map((dl) => ({
                id: dl.id,
                name: dl.filename,
                originalLink: dl.link,
                downloadLink: dl.download,
                size: dl.filesize || undefined,
                status: "completed" as const,
                createdAt: new Date(dl.generated),
                host: dl.host,
            })),
            offset,
            limit,
            hasMore: downloads.length === limit,
        };
    }

    async deleteWebDownload(id: string): Promise<void> {
        await this.makeRequest<void>(`downloads/delete/${id}`, {
            method: "DELETE",
        });
    }

    private async selectAllFiles(torrentId: string): Promise<void> {
        const body = new URLSearchParams({ files: "all" });

        try {
            // This request may return a 204 No Content
            await this.makeRequest<void>(`torrents/selectFiles/${torrentId}`, {
                method: "POST",
                body: body.toString(),
                headers: RealDebridClient.FORM_HEADERS,
            });
        } catch {
            // Selection may already be done (HTTP 202), ignore errors
        }
    }

    private mapToDebridFile(torrent: RDTorrentListItem): DebridFile {
        const status = this.mapTorrentStatus(torrent.status);

        return {
            id: torrent.id,
            name: torrent.filename,
            size: torrent.bytes,
            status,
            progress: torrent.progress,
            downloadSpeed: torrent.speed,
            peers: torrent.seeders,
            createdAt: new Date(torrent.added),
            completedAt: torrent.ended ? new Date(torrent.ended) : undefined,
            error: status === "failed" ? torrent.status : undefined,
        };
    }

    private mapTorrentStatus(status: TorrentStatus): DebridFileStatus {
        switch (status) {
            case "magnet_conversion":
            case "waiting_files_selection":
            case "queued":
                return "waiting";
            case "downloading":
                return "downloading";
            case "compressing":
                return "processing";
            case "uploading":
                return "uploading";
            case "downloaded":
                return "completed";
            case "magnet_error":
            case "error":
            case "virus":
            case "dead":
                return "failed";
            default:
                return "unknown";
        }
    }

    /**
     * Build a nested file tree from Real-Debrid's flat file paths.
     * Files have paths like "/folder/subfolder/file.ext".
     * Links array corresponds to selected files in order.
     * Uses Map for O(1) folder lookups instead of Array.find.
     */
    private buildFileTree(files: RDTorrentFile[], links: string[]): DebridNode[] {
        const root: DebridNode[] = [];
        // Map keyed by full path prefix for O(1) folder lookups
        const folderMap = new Map<string, DebridNode>();

        const selectedFiles = files.filter((f) => f.selected === 1);

        for (let i = 0; i < selectedFiles.length; i++) {
            const file = selectedFiles[i];
            const link = links[i] || "";
            const segments = file.path.replace(/^\//, "").split("/");

            let currentLevel = root;
            let pathKey = "";

            for (let j = 0; j < segments.length; j++) {
                const segment = segments[j];
                const isFile = j === segments.length - 1;

                if (isFile) {
                    currentLevel.push({
                        id: link,
                        name: segment,
                        size: file.bytes,
                        type: "file",
                        children: [],
                    });
                } else {
                    pathKey += `/${segment}`;
                    let folder = folderMap.get(pathKey);
                    if (!folder) {
                        folder = {
                            name: segment,
                            size: undefined,
                            type: "folder",
                            children: [],
                        };
                        folderMap.set(pathKey, folder);
                        currentLevel.push(folder);
                    }
                    currentLevel = folder.children;
                }
            }
        }

        return root;
    }
}
