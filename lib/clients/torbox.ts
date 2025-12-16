import {
    DebridFile,
    DebridFileStatus,
    DebridFileNode,
    DebridLinkInfo,
    DebridFileList,
    DebridFileAddStatus,
    AccountType,
    User,
    AuthError,
    DebridError,
    RateLimitError,
} from "@/lib/types";
import BaseClient from "./base";
import { USER_AGENT } from "../constants";
import { useUserStore } from "../stores/users";

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

export default class TorBoxClient extends BaseClient {
    private readonly baseUrl = `https://torbox.bustcors.workers.dev/?url=${encodeURIComponent("https://api.torbox.app/v1/api")}`;

    constructor(user: User) {
        super(user);
    }

    private async makeRequest<T>(
        path: string,
        options: RequestInit & { returnRaw?: boolean } = { returnRaw: false }
    ): Promise<T> {
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

        if (!response.ok) {
            if (response.status === 401) {
                useUserStore.getState().removeUser(this.user.id);
                throw new AuthError("Invalid or expired API key", "AUTH_INVALID_APIKEY", response.status);
            }
            if (response.status === 429) {
                const retryAfter = response.headers.get("Retry-After");
                throw new RateLimitError(
                    "Rate limit exceeded",
                    "RATE_LIMIT_EXCEEDED",
                    retryAfter ? parseInt(retryAfter) : undefined
                );
            }
            throw new DebridError(`API request failed: ${response.statusText}`, "API_REQUEST_FAILED", response.status);
        }

        const data: TorBoxResponse<T> = await response.json();

        if (!data.success) {
            const errorMessage = data.detail || data.error || "Unknown error";
            if (errorMessage.includes("auth") || errorMessage.includes("token")) {
                useUserStore.getState().removeUser(this.user.id);
                throw new AuthError(errorMessage, "AUTH_ERROR");
            }
            throw new DebridError(errorMessage, "API_ERROR");
        }

        return (options.returnRaw ? data : data.data) as T;
    }

    static async getUser(apiKey: string): Promise<User> {
        const response = await fetch("https://torbox.bustcors.workers.dev/?url=https://api.torbox.app/v1/api/user/me", {
            headers: {
                Authorization: `Bearer ${apiKey}`,
                "User-Agent": USER_AGENT,
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to get user info: ${response.statusText}`);
        }

        const data: TorBoxResponse<TorBoxUser> = await response.json();

        if (!data.success || !data.data) {
            throw new Error("Failed to get user information");
        }

        const user = data.data;
        const premiumExpiry = user.premium_expires_at ? new Date(user.premium_expires_at) : new Date();
        const isPremium = user.is_subscribed && premiumExpiry > new Date();

        return {
            id: `${AccountType.TORBOX}:${user.email}`,
            apiKey,
            type: AccountType.TORBOX,
            username: user.email,
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
            redirect_url: "https://corsproxy.io/?url=https://torbox.app/settings/api",
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
        const { files } = await this.getTorrentList({ limit: 1000 });

        if (!searchQuery.trim()) {
            return files;
        }

        return files.filter((file) => file.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }

    async findTorrentById(torrentId: string): Promise<DebridFile | null> {
        try {
            const torrent = await this.makeRequest<TorBoxTorrent>(`torrents/mylist?id=${torrentId}`);
            return this.mapToDebridFile(torrent);
        } catch {
            return null;
        }
    }

    async getDownloadLink(fileId: string): Promise<DebridLinkInfo> {
        // For TorBox, fileId should be in format "torrentId:fileId"
        const [torrentId, targetFileId] = fileId.split(":");

        if (!torrentId || !targetFileId) {
            throw new DebridError("Invalid file ID format. Expected 'torrentId:fileId'", "INVALID_FILE_ID");
        }

        const downloadUrl = `https://api.torbox.app/v1/api/torrents/requestdl?token=${this.user.apiKey}&torrent_id=${torrentId}&file_id=${targetFileId}&redirect=true`;

        return {
            link: downloadUrl,
            name: "Unknown",
            size: 0,
        };
    }

    async getTorrentFiles(torrentId: string): Promise<DebridFileNode[]> {
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

    async restartTorrents(torrentIds: string[]): Promise<Record<string, string>> {
        const results: Record<string, string> = {};

        for (const torrentId of torrentIds) {
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

                results[torrentId] = "Torrent restarted successfully";
            } catch (error) {
                results[torrentId] = error instanceof Error ? error.message : "Failed to restart torrent";
            }
        }

        return results;
    }

    async addMagnetLinks(magnetUris: string[]): Promise<Record<string, DebridFileAddStatus>> {
        const results: Record<string, DebridFileAddStatus> = {};

        for (const magnet of magnetUris) {
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

                results[magnet] = {
                    id: response.data.torrent_id,
                    message: "Torrent added successfully",
                    is_cached: response.detail.toLowerCase().includes("cached"),
                };
            } catch (error) {
                results[magnet] = {
                    message: "Failed to add torrent",
                    error: error instanceof Error ? error.message : "Unknown error",
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

                results[file.name] = {
                    id: response.torrent_id || response.id,
                    message: "Torrent file uploaded successfully",
                    is_cached: response.cached || false,
                };
            } catch (error) {
                results[file.name] = {
                    message: "Failed to upload torrent file",
                    error: error instanceof Error ? error.message : "Unknown error",
                    is_cached: false,
                };
            }
        }

        return results;
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
            size: torrent.size,
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
}
