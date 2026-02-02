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
    DebridError,
    DebridAuthError,
    WebDownloadAddResult,
    WebDownloadList,
} from "@/lib/types";
import BaseClient from "./base";
import { USER_AGENT } from "../constants";
import Fuse from "fuse.js";

// Response type definitions
interface FileNode {
    n: string;
    s: number;
    l: string;
}

interface FolderNode {
    n: string;
    e: FileNode[];
}

interface TorrentFile {
    id: string;
    files: FileNode[] | FolderNode[];
}

interface TorrentStatus {
    id: number;
    filename?: string;
    size?: number;
    status?: string;
    statusCode: number;
    downloaded?: number;
    uploaded?: number;
    seeders?: number;
    downloadSpeed?: number;
    uploadSpeed?: number;
    uploadDate: number;
    completionDate?: number;
    processingPerc?: number;
    deleted?: boolean;
}

interface LiveModeResponse {
    counter: number;
    fullsync: boolean;
    magnets: TorrentStatus[];
}

interface BaseInfo {
    id: number;
    name: string;
    size: number;
    hash: string;
    ready: boolean;
}

interface ErrorResponse {
    error: {
        code: number;
        message: string;
    };
}

interface AddFileResponse {
    files: ({ file: string } & BaseInfo & ErrorResponse)[];
}

interface AddTorrentResponse {
    magnets: ({ magnet: string } & BaseInfo & ErrorResponse)[];
}

interface RetryResponse {
    magnets: ({ magnet: string; message?: string } & ErrorResponse)[];
}

export default class AllDebridClient extends BaseClient {
    private readonly sessionId: number;
    private counter: number = 0;
    private readonly torrentsCache = new Map<number, TorrentStatus>();
    private torrentOrder: number[] = []; // Maintains order with newest first

    // AllDebrid unlocks instantly, no refresh needed
    // Unlocked links are ephemeral (not saved to API unless explicitly saved)
    readonly refreshInterval = false as const;
    readonly supportsEphemeralLinks = true;

    constructor(user: User) {
        super({ user });
        this.sessionId = Math.floor(Math.random() * 1000000);
    }

    private async makeRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
        await this.rateLimiter.acquire();
        const { apiKey } = this.user;
        const url = `https://api.alldebrid.com/v4.1/${path}?agent=${USER_AGENT}`;

        const response = await fetch(url, {
            ...options,
            headers: {
                Authorization: `Bearer ${apiKey}`,
                ...options.headers,
            },
        });

        if (!response.ok) {
            throw new Error(`API request failed for ${path}: ${response.statusText}`);
        }

        const data = await response.json();
        AllDebridClient.validateResponse(data);
        return data.data;
    }

    static async getUser(apiKey: string): Promise<User> {
        const url = `https://api.alldebrid.com/v4.1/user?agent=${USER_AGENT}`;

        const response = await fetch(url, {
            headers: { Authorization: `Bearer ${apiKey}` },
        });

        const data = await response.json();
        this.validateResponse(data);

        const { user } = data.data;
        const premiumExpiry = (user.premiumUntil || 0) * 1000;
        const premiumExpiresAt = new Date(premiumExpiry);
        const isPremium = premiumExpiresAt && premiumExpiresAt > new Date();

        return {
            id: `${AccountType.ALLDEBRID}:${user.username}`,
            apiKey,
            type: AccountType.ALLDEBRID,
            name: user.username,
            email: user.email,
            language: user.language,
            isPremium,
            premiumExpiresAt,
        };
    }

    static async getAuthPin(): Promise<{
        pin: string;
        check: string;
        redirect_url: string;
    }> {
        const url = `https://api.alldebrid.com/v4.1/pin/get?agent=${USER_AGENT}`;
        const response = await fetch(url);
        const data = await response.json();

        this.validateResponse(data);

        return {
            pin: data.data.pin,
            check: data.data.check,
            redirect_url: data.data.user_url,
        };
    }

    static async validateAuthPin(
        pin: string,
        check: string,
        timeoutMs: number = 600000 // 10 minutes
    ): Promise<{ success: boolean; apiKey?: string }> {
        const formData = new FormData();
        formData.append("pin", pin);
        formData.append("check", check);

        const startTime = Date.now();
        const url = `https://api.alldebrid.com/v4.1/pin/check?agent=${USER_AGENT}`;

        while (Date.now() - startTime < timeoutMs) {
            const response = await fetch(url, {
                method: "POST",
                body: formData,
            });

            const data = await response.json();
            this.validateResponse(data);

            if (data.data.activated) {
                return {
                    success: true,
                    apiKey: data.data.apikey,
                };
            }

            await this.delay(1000);
        }

        throw new Error("Authentication timeout: PIN was not activated within the time limit");
    }

    async getTorrentList({
        offset = 0,
        limit = 20,
    }: {
        offset?: number;
        limit?: number;
    } = {}): Promise<DebridFileList> {
        await this.syncTorrentStatus();

        const files: DebridFile[] = [];
        const endIndex = Math.min(offset + limit, this.torrentOrder.length);

        for (let i = offset; i < endIndex; i++) {
            const torrentId = this.torrentOrder[i];
            const torrent = this.torrentsCache.get(torrentId);

            if (torrent?.filename) {
                files.push(this.mapToDebridFile(torrent));
            }
        }

        return {
            files,
            offset,
            limit,
            hasMore: endIndex < this.torrentOrder.length,
            total: this.torrentOrder.length,
        };
    }

    async findTorrents(searchQuery: string): Promise<DebridFile[]> {
        await this.syncTorrentStatus();

        const fuse = new Fuse(Array.from(this.torrentsCache.values()), {
            keys: ["filename"],
            threshold: 0.3,
            includeScore: true,
            minMatchCharLength: 2,
        });
        const results = fuse.search(searchQuery);

        return results.map((result) => this.mapToDebridFile(result.item));
    }

    async findTorrentById(torrentId: string): Promise<DebridFile | null> {
        await this.syncTorrentStatus();
        const torrent = this.torrentsCache.get(parseInt(torrentId));
        return torrent ? this.mapToDebridFile(torrent) : null;
    }

    async getDownloadLink({ fileNode }: { fileNode: DebridFileNode; resolve?: boolean }): Promise<DebridLinkInfo> {
        const formData = new FormData();
        formData.append("link", fileNode.id);

        const response = await this.makeRequest<{
            link: string;
            filename: string;
            filesize: number;
        }>(`link/unlock`, {
            method: "POST",
            body: formData,
        });

        // Use file node's properties as fallback if API doesn't provide them
        return {
            link: response.link,
            name: response.filename || fileNode.name,
            size: response.filesize || fileNode.size || 0,
        };
    }

    async getTorrentFiles(torrentId: string): Promise<DebridNode[]> {
        const formData = new FormData();
        formData.append("id[]", torrentId);

        const response = await this.makeRequest<{ magnets: TorrentFile[] }>(`magnet/files`, {
            method: "POST",
            body: formData,
        });

        const torrentFile = response.magnets[0];
        return this.convertFileNodes(torrentFile.files);
    }

    async removeTorrent(torrentId: string): Promise<string> {
        const formData = new FormData();
        formData.append("id", torrentId);

        const response = await this.makeRequest<{ message: string }>(`magnet/delete`, {
            method: "POST",
            body: formData,
        });

        this.removeTorrentFromCache(parseInt(torrentId));
        return response.message;
    }

    async restartTorrents(torrentIds: string[]): Promise<Record<string, OperationResult>> {
        const formData = new FormData();
        torrentIds.forEach((id) => formData.append("ids[]", id));

        const response: RetryResponse = await this.makeRequest(`magnet/restart`, {
            method: "POST",
            body: formData,
        });

        return response.magnets.reduce(
            (results, torrent) => {
                const hasError = !!torrent.error?.message;
                results[torrent.magnet] = {
                    success: !hasError,
                    message: torrent.message || torrent.error?.message || "Unknown error occurred",
                };
                return results;
            },
            {} as Record<string, OperationResult>
        );
    }

    async addMagnetLinks(magnetUris: string[]): Promise<Record<string, DebridFileAddStatus>> {
        const formData = new FormData();
        magnetUris.forEach((magnet) => formData.append("magnets[]", magnet));

        const response: AddTorrentResponse = await this.makeRequest(`magnet/upload`, {
            method: "POST",
            body: formData,
        });

        return response.magnets.reduce(
            (results, torrent) => {
                const hasError = !!torrent.error?.message;
                results[torrent.magnet] = {
                    success: !hasError,
                    id: torrent.id,
                    message: torrent.error?.message || `Successfully added: ${torrent.name}`,
                    is_cached: torrent.ready,
                };
                return results;
            },
            {} as Record<string, DebridFileAddStatus>
        );
    }

    async uploadTorrentFiles(files: File[]): Promise<Record<string, DebridFileAddStatus>> {
        const formData = new FormData();
        files.forEach((file) => formData.append("files[]", file));

        const response: AddFileResponse = await this.makeRequest(`magnet/upload/file`, {
            method: "POST",
            body: formData,
        });

        return response.files.reduce(
            (results, file) => {
                const key = file.name || file.hash;
                const hasError = !!file.error?.message;
                results[key] = {
                    success: !hasError,
                    id: file.id,
                    message: file.error?.message || `Successfully uploaded: ${file.name}`,
                    is_cached: file.ready,
                };
                return results;
            },
            {} as Record<string, DebridFileAddStatus>
        );
    }

    // Web download methods - AllDebrid uses instant link unlock
    async addWebDownloads(links: string[]): Promise<WebDownloadAddResult[]> {
        const results = await Promise.allSettled(
            links.map(async (link) => {
                const formData = new FormData();
                formData.append("link", link);

                const response = await this.makeRequest<{
                    link: string;
                    filename: string;
                    filesize: number;
                    host: string;
                    id: string;
                }>("link/unlock", {
                    method: "POST",
                    body: formData,
                });

                return {
                    link,
                    success: true,
                    downloadLink: response.link,
                    name: response.filename,
                    size: response.filesize,
                    id: response.id || link,
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
                error: result.reason?.message || "Failed to unlock link",
            };
        });
    }

    async getWebDownloadList({ offset, limit }: { offset: number; limit: number }): Promise<WebDownloadList> {
        // AllDebrid API doesn't support pagination - fetch all and paginate client-side
        const data = await this.makeRequest<{
            links: Array<{
                link: string;
                filename: string;
                size: number;
                date: number;
                host: string;
            }>;
        }>("user/links");

        const allLinks = data?.links ?? [];
        const total = allLinks.length;
        const paginatedLinks = allLinks.slice(offset, offset + limit);

        return {
            downloads: paginatedLinks.map((link) => ({
                id: link.link,
                name: link.filename,
                originalLink: link.link,
                size: link.size,
                status: "completed" as const,
                createdAt: new Date(link.date * 1000),
                host: link.host,
            })),
            offset,
            limit,
            hasMore: offset + limit < total,
            total,
        };
    }

    async deleteWebDownload(id: string): Promise<void> {
        const formData = new FormData();
        formData.append("links[]", id);

        await this.makeRequest("user/links/delete", {
            method: "POST",
            body: formData,
        });
    }

    async saveWebDownloadLinks(links: string[]): Promise<void> {
        const formData = new FormData();
        links.forEach((link) => formData.append("links[]", link));

        await this.makeRequest("user/links/save", {
            method: "POST",
            body: formData,
        });
    }

    private mapToDebridFile(torrent: TorrentStatus): DebridFile {
        const status = this.mapStatusCode(torrent.statusCode);
        let progress: number | undefined;

        const p = status === "downloading" ? torrent.downloaded : status === "uploading" ? torrent.uploaded : null;
        if (p != null && torrent.size) progress = (p / torrent.size) * 100;

        return {
            id: torrent.id.toString(),
            name: torrent.filename!,
            size: torrent.size || 0,
            status,
            progress,
            downloadSpeed: torrent.downloadSpeed,
            uploadSpeed: torrent.uploadSpeed,
            uploaded: torrent.uploaded,
            downloaded: torrent.downloaded,
            peers: torrent.seeders,
            createdAt: new Date(torrent.uploadDate * 1000),
            completedAt: torrent.completionDate ? new Date(torrent.completionDate * 1000) : undefined,
            error: status === "failed" ? torrent.status : undefined,
            files: undefined, // AllDebrid requires a separate request to get files
        };
    }

    private async syncTorrentStatus(): Promise<void> {
        const formData = new FormData();
        formData.append("session", this.sessionId.toString());
        formData.append("counter", this.counter.toString());

        const response: LiveModeResponse = await this.makeRequest(`magnet/status`, {
            method: "POST",
            body: formData,
        });

        this.counter = response.counter;

        if (response.fullsync) {
            this.performFullSync(response.magnets);
        } else {
            this.performIncrementalSync(response.magnets);
        }
    }

    private performFullSync(torrents: TorrentStatus[]): void {
        this.torrentsCache.clear();
        this.torrentOrder = [];

        for (const torrent of torrents) {
            this.torrentsCache.set(torrent.id, torrent);
            this.torrentOrder.push(torrent.id);
        }
    }

    private performIncrementalSync(torrents: TorrentStatus[]): void {
        const newTorrentIds: number[] = [];

        for (const torrent of torrents) {
            const existingTorrent = this.torrentsCache.get(torrent.id);

            if (existingTorrent) {
                if (torrent.deleted) {
                    this.removeTorrentFromCache(torrent.id);
                } else {
                    // Merge with existing data
                    this.torrentsCache.set(torrent.id, {
                        ...existingTorrent,
                        ...torrent,
                    });
                }
            } else if (!torrent.deleted) {
                // New torrent
                this.torrentsCache.set(torrent.id, torrent);
                newTorrentIds.push(torrent.id);
            }
        }

        // Add new torrents to the beginning of the order array
        if (newTorrentIds.length > 0) {
            this.torrentOrder = [...newTorrentIds, ...this.torrentOrder];
        }
    }

    private removeTorrentFromCache(torrentId: number): void {
        if (this.torrentsCache.delete(torrentId)) {
            this.torrentOrder = this.torrentOrder.filter((id) => id !== torrentId);
        }
    }

    private convertFileNodes(nodes: FileNode[] | FolderNode[]): DebridNode[] {
        return nodes.map(this.convertSingleNode);
    }

    private convertSingleNode = (node: FileNode | FolderNode): DebridNode => {
        if ("e" in node) {
            // Folder node
            return {
                name: node.n,
                size: undefined,
                type: "folder",
                children: node.e.map(this.convertSingleNode),
            };
        }

        // File node
        return {
            id: node.l,
            name: node.n,
            size: node.s,
            type: "file",
            children: [],
        };
    };

    private mapStatusCode(statusCode: number): DebridFileStatus {
        const statusMap: Record<number, DebridFileStatus> = {
            0: "waiting",
            1: "downloading",
            2: "paused",
            3: "uploading",
            4: "completed",
            7: "failed",
            10: "failed",
            15: "failed",
        };

        return statusMap[statusCode] || "unknown";
    }

    private static validateResponse(data: { status: string; error?: { message?: string; code?: string } }): void {
        if (data.status !== "success") {
            const message = data.error?.message || "API request failed";
            const code = data.error?.code || "Unknown";
            if (["AUTH_MISSING_APIKEY", "AUTH_BAD_APIKEY", "AUTH_BLOCKED", "AUTH_USER_BANNED"].includes(code)) {
                throw new DebridAuthError(message, AccountType.ALLDEBRID);
            }
            throw new DebridError(message, AccountType.ALLDEBRID);
        }
    }

    private static delay(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}
