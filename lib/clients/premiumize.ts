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
    Account,
    FullAccount,
    DebridAuthError,
    DebridError,
    DebridRateLimitError,
    WebDownloadList,
    WebDownloadStatus,
} from "@/lib/types";
import BaseClient from "./base";
import { USER_AGENT } from "../constants";
import { getProxyUrl } from "@/lib/utils";
import type { WebDownloadAddResult } from "@/lib/types";

// Premiumize API Response types
interface PremiumizeApiResponse {
    status: "success" | "error";
    message?: string;
}

interface PremiumizeAccountInfo extends PremiumizeApiResponse {
    customer_id: number;
    premium_until: number;
    limit_used: number;
    space_used: number;
}

type PremiumizeTransferStatus =
    | "waiting"
    | "finished"
    | "running"
    | "deleted"
    | "banned"
    | "error"
    | "timeout"
    | "seeding"
    | "queued";

interface PremiumizeTransfer {
    id: string;
    name: string;
    status: PremiumizeTransferStatus;
    progress: number;
    src?: string;
    folder_id?: string;
    file_id?: string;
    message?: string;
}

interface PremiumizeTransferListResponse extends PremiumizeApiResponse {
    transfers: PremiumizeTransfer[];
}

interface PremiumizeItem {
    id: string;
    name: string;
    type: "file" | "folder";
    size?: number;
    created_at?: number;
    mime_type?: string;
    link?: string;
    stream_link?: string;
    virus_scan?: "ok" | "infected" | "error";
    transcode_status?: string;
}

interface PremiumizeFolderListResponse extends PremiumizeApiResponse {
    content: PremiumizeItem[];
    name?: string;
    parent_id?: string;
    folder_id?: string;
    breadcrumbs?: { id: string; name: string; parent_id: string }[];
}

interface PremiumizeItemListAllFile {
    id: string;
    name: string;
    created_at: number;
    size: number;
    mime_type?: string;
    virus_scan?: "ok" | "infected" | "error";
    path: string;
}

interface PremiumizeItemListAllResponse extends PremiumizeApiResponse {
    files: PremiumizeItemListAllFile[];
}

interface PremiumizeItemDetails extends PremiumizeApiResponse {
    id: string;
    name: string;
    type: string;
    size: number;
    created_at: number;
    folder_id?: string;
    link?: string;
    stream_link?: string;
    mime_type?: string;
    transcode_status?: string;
    virus_scan?: string;
}

interface PremiumizeTransferCreateResponse extends PremiumizeApiResponse {
    id?: string;
    name?: string;
    type?: string;
}

interface PremiumizeDirectDlContent {
    path: string;
    size: number;
    link: string;
    stream_link?: string;
    transcode_status?: string;
}

interface PremiumizeDirectDlResponse extends PremiumizeApiResponse {
    location?: string;
    filename?: string;
    filesize?: number;
    content?: PremiumizeDirectDlContent[];
}

interface PremiumizeCacheCheckResponse extends PremiumizeApiResponse {
    response: boolean[];
    transcoded: boolean[];
    filename: string[];
    filesize: string[];
}

export default class PremiumizeClient extends BaseClient {
    readonly refreshInterval: number | false = false;
    readonly supportsEphemeralLinks: boolean = false;
    private static readonly OAUTH_CLIENT_ID = process.env.NEXT_PUBLIC_PREMIUMIZE_CLIENT_ID || "";

    constructor(account: Account) {
        super({ account });
    }

    /**
     * Check if Premiumize OAuth is configured
     * Returns true only if NEXT_PUBLIC_PREMIUMIZE_CLIENT_ID is explicitly set (not the default)
     */
    static isOAuthConfigured(): boolean {
        return PremiumizeClient.OAUTH_CLIENT_ID !== "";
    }
    private static buildUrl(path: string, apiKey: string): string {
        return getProxyUrl(PremiumizeClient.appendApiKeyToUrl(`https://www.premiumize.me/api${path}`, apiKey));
    }
    private static appendApiKeyToUrl(url: string, apiKey?: string): string {
        if (!apiKey) return url;
        // If apiKey is an OAuth token (prefixed with 'Bearer '), don't append to URL
        if (apiKey.trim().toLowerCase().startsWith("bearer ")) return url;

        const separator = url.includes("?") ? "&" : "?";
        return `${url}${separator}apikey=${encodeURIComponent(apiKey)}`;
    }

    private async makeRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
        await this.rateLimiter.acquire();
        const { apiKey } = this.account;

        const url = PremiumizeClient.buildUrl(path, apiKey);

        const headers: Record<string, string> = {
            "User-Agent": USER_AGENT,
            ...((options.headers as Record<string, string>) || {}),
        };

        // If we have an OAuth token (prefixed with 'Bearer '), send it in Authorization
        if (apiKey && apiKey.trim().toLowerCase().startsWith("bearer ")) {
            headers["Authorization"] = apiKey.trim();
        }

        const response = await fetch(url, {
            ...options,
            headers,
        });

        if (!response.ok) {
            if (response.status === 401) {
                throw new DebridAuthError("Invalid or expired API key", AccountType.PREMIUMIZE);
            }
            if (response.status === 429) {
                const retryAfter = response.headers.get("Retry-After");
                throw new DebridRateLimitError(
                    "Rate limit exceeded",
                    AccountType.PREMIUMIZE,
                    retryAfter ? parseInt(retryAfter) : undefined
                );
            }
            throw new DebridError(`API request failed: ${response.statusText}`, AccountType.PREMIUMIZE);
        }

        const data = await response.json();

        if (data.status === "error") {
            const errorMessage = data.message || "Unknown error";
            if (
                errorMessage.toLowerCase().includes("auth") ||
                errorMessage.toLowerCase().includes("apikey") ||
                errorMessage.toLowerCase().includes("token")
            ) {
                throw new DebridAuthError(errorMessage, AccountType.PREMIUMIZE);
            }
            throw new DebridError(errorMessage, AccountType.PREMIUMIZE);
        }

        return data as T;
    }

    static async getUser(apiKey: string): Promise<FullAccount> {
        const url = PremiumizeClient.buildUrl("/account/info", apiKey);

        const headers: Record<string, string> = { "User-Agent": USER_AGENT };
        if (apiKey && apiKey.trim().toLowerCase().startsWith("bearer ")) {
            headers["Authorization"] = apiKey.trim();
        }

        const response = await fetch(url, { headers });

        if (!response.ok) {
            if (response.status === 401) {
                throw new DebridAuthError("Invalid or expired API key", AccountType.PREMIUMIZE);
            }
            throw new DebridError(`Failed to get user info: ${response.statusText}`, AccountType.PREMIUMIZE);
        }

        const data: PremiumizeAccountInfo = await response.json();

        if (data.status === "error") {
            throw new DebridError(data.message || "Failed to get user information", AccountType.PREMIUMIZE);
        }

        const premiumExpiry = data.premium_until ? new Date(data.premium_until * 1000) : new Date();
        const isPremium = premiumExpiry > new Date();

        return {
            id: `${AccountType.PREMIUMIZE}:${data.customer_id}`,
            apiKey,
            type: AccountType.PREMIUMIZE,
            name: `${data.customer_id}`,
            email: "••••",
            language: "en",
            isPremium,
            premiumExpiresAt: premiumExpiry,
        };
    }

    /**
     * Exchange authorization code for access token (OAuth Authorization Code Flow)
     * Called by backend callback handler after user approves at Premiumize
     */
    static async exchangeCodeForToken(code: string): Promise<string> {
        const clientSecret = process.env.PREMIUMIZE_CLIENT_SECRET;
        if (!clientSecret) {
            throw new Error("PREMIUMIZE_CLIENT_SECRET environment variable not set");
        }

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        const redirectUri = `${appUrl}/api/debrid/premiumize/callback`;

        const params = new URLSearchParams({
            grant_type: "authorization_code",
            code,
            client_id: PremiumizeClient.OAUTH_CLIENT_ID,
            client_secret: clientSecret,
            redirect_uri: redirectUri,
        });

        const response = await fetch(getProxyUrl("https://www.premiumize.me/token"), {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "User-Agent": USER_AGENT,
            },
            body: params.toString(),
        });

        if (!response.ok) {
            let errorDetails = "";
            try {
                const error = await response.json();
                errorDetails = error.error_description || error.error || response.statusText;
            } catch {
                errorDetails = response.statusText;
            }
            throw new Error(`Token exchange failed: ${errorDetails}`);
        }

        const data: {
            access_token: string;
            token_type: string;
            expires_in: number;
            refresh_token?: string;
        } = await response.json();

        if (!data.access_token) {
            throw new Error("No access token in response");
        }

        return data.access_token;
    }

    /**
     * Generate authorization URL for OAuth Authorization Code Flow
     * Frontend redirects user to this URL
     */
    static getAuthorizationUrl(state: string): string {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        const redirectUri = `${appUrl}/api/debrid/premiumize/callback`;

        const params = new URLSearchParams({
            client_id: PremiumizeClient.OAUTH_CLIENT_ID,
            redirect_uri: redirectUri,
            response_type: "code",
            state,
            // Optional: scope: "account transfers items"
        });

        return `https://www.premiumize.me/authorize?${params.toString()}`;
    }

    async getTorrentList({
        offset = 0,
        limit = 20,
    }: {
        offset?: number;
        limit?: number;
    } = {}): Promise<DebridFileList> {
        // Fetch both transfers (active) and ALL files (completed) in parallel
        // Using /item/listall to get files from all folders, not just root
        const [transfersResponse, itemsResponse] = await Promise.all([
            this.makeRequest<PremiumizeTransferListResponse>("/transfer/list"),
            this.makeRequest<PremiumizeItemListAllResponse>("/item/listall"),
        ]);

        const files: DebridFile[] = [];

        // Map active transfers first (downloading, queued, etc.)
        const activeTransfers = (transfersResponse.transfers || []).filter(
            (t) => t.status !== "finished" && t.status !== "deleted"
        );

        for (const transfer of activeTransfers) {
            files.push(this.mapTransferToDebridFile(transfer));
        }

        // Map ALL files from cloud storage (from all folders)
        const allFiles = itemsResponse.files || [];

        for (const file of allFiles) {
            files.push(this.mapListAllFileToDebridFile(file));
        }

        // Apply pagination
        const paginatedFiles = files.slice(offset, offset + limit);

        return {
            files: paginatedFiles,
            offset,
            limit,
            hasMore: offset + limit < files.length,
            total: files.length,
        };
    }

    async findTorrents(searchQuery: string): Promise<DebridFile[]> {
        if (!searchQuery.trim()) {
            return (await this.getTorrentList({ limit: 100 })).files;
        }

        // Use Premiumize's folder search
        const response = await this.makeRequest<PremiumizeFolderListResponse>(
            `/folder/search?q=${encodeURIComponent(searchQuery)}`
        );

        const files: DebridFile[] = [];

        for (const item of response.content || []) {
            if (item.type === "file") {
                files.push(this.mapItemToDebridFile(item));
            }
        }

        return files;
    }

    async findTorrentById(torrentId: string): Promise<DebridFile | null> {
        try {
            // First check if it's a transfer
            const transfersResponse = await this.makeRequest<PremiumizeTransferListResponse>("/transfer/list");
            const transfer = transfersResponse.transfers?.find((t) => t.id === torrentId);

            if (transfer) {
                return this.mapTransferToDebridFile(transfer);
            }

            // Otherwise try to get item details
            const itemResponse = await this.makeRequest<PremiumizeItemDetails>(`/item/details?id=${torrentId}`);

            return this.mapItemDetailsToDebridFile(itemResponse);
        } catch {
            return null;
        }
    }

    async getDownloadLink({ fileNode }: { fileNode: DebridFileNode; resolve?: boolean }): Promise<DebridLinkInfo> {
        // For Premiumize, the fileNode.id could be an item ID or a direct link
        // First, try to get item details to get the download link
        try {
            const itemResponse = await this.makeRequest<PremiumizeItemDetails>(`/item/details?id=${fileNode.id}`);

            if (itemResponse.link) {
                return {
                    link: itemResponse.link,
                    name: itemResponse.name || fileNode.name,
                    size: itemResponse.size || fileNode.size || 0,
                };
            }
        } catch {
            // If item details fails, the ID might be a magnet/link for directdl
        }

        // Fall back to directdl for magnets or external links
        if (fileNode.id.startsWith("magnet:") || fileNode.id.startsWith("http")) {
            const formData = new URLSearchParams();
            formData.append("src", fileNode.id);

            const response = await this.makeRequest<PremiumizeDirectDlResponse>("/transfer/directdl", {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: formData,
            });

            if (response.content && response.content.length > 0) {
                // Return the first file's link
                const firstFile = response.content[0];
                return {
                    link: firstFile.link,
                    name: firstFile.path.split("/").pop() || fileNode.name,
                    size: firstFile.size || fileNode.size || 0,
                };
            }

            if (response.location) {
                return {
                    link: response.location,
                    name: response.filename || fileNode.name,
                    size: response.filesize || fileNode.size || 0,
                };
            }
        }

        throw new DebridError("Could not get download link for this file", AccountType.PREMIUMIZE);
    }

    async getTorrentFiles(torrentId: string): Promise<DebridNode[]> {
        // First check if this is a transfer ID (from /transfer/create)
        try {
            const transfersResponse = await this.makeRequest<PremiumizeTransferListResponse>("/transfer/list");
            const transfer = transfersResponse.transfers?.find((t) => t.id === torrentId);

            if (transfer) {
                // If transfer has a folder_id, browse that folder
                if (transfer.folder_id) {
                    const folderResponse = await this.makeRequest<PremiumizeFolderListResponse>(
                        `/folder/list?id=${transfer.folder_id}`
                    );
                    return this.convertItemsToNodes(folderResponse.content || []);
                }
                // If transfer has a file_id (single file), get that item
                if (transfer.file_id) {
                    const itemResponse = await this.makeRequest<PremiumizeItemDetails>(
                        `/item/details?id=${transfer.file_id}`
                    );
                    return [
                        {
                            id: itemResponse.id,
                            name: itemResponse.name,
                            size: itemResponse.size,
                            type: "file" as const,
                            children: [],
                        },
                    ];
                }
                // Transfer is still in progress, no files available yet
                return [];
            }
        } catch {
            // Not a transfer or error fetching transfers, continue with existing logic
        }

        // Existing logic: try as folder
        try {
            const folderResponse = await this.makeRequest<PremiumizeFolderListResponse>(`/folder/list?id=${torrentId}`);
            return this.convertItemsToNodes(folderResponse.content || []);
        } catch {
            // If not a folder, try to get item details (single file)
            try {
                const itemResponse = await this.makeRequest<PremiumizeItemDetails>(`/item/details?id=${torrentId}`);
                return [
                    {
                        id: itemResponse.id,
                        name: itemResponse.name,
                        size: itemResponse.size,
                        type: "file" as const,
                        children: [],
                    },
                ];
            } catch {
                return [];
            }
        }
    }

    async removeTorrent(torrentId: string): Promise<string> {
        // Try to delete as transfer first
        try {
            const formData = new URLSearchParams();
            formData.append("id", torrentId);

            await this.makeRequest<PremiumizeApiResponse>("/transfer/delete", {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: formData,
            });

            return "Transfer removed successfully";
        } catch {
            // If not a transfer, try to delete as item
            const formData = new URLSearchParams();
            formData.append("id", torrentId);

            await this.makeRequest<PremiumizeApiResponse>("/item/delete", {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: formData,
            });

            return "Item removed successfully";
        }
    }

    async restartTorrents(torrentIds: string[]): Promise<Record<string, OperationResult>> {
        return torrentIds.reduce(
            (acc, id) => {
                acc[id] = { success: false, message: "Premiumize does not support restarting transfers" };
                return acc;
            },
            {} as Record<string, OperationResult>
        );
    }

    async addMagnetLinks(magnetUris: string[]): Promise<Record<string, DebridFileAddStatus>> {
        // Parallelize magnet link additions
        const promises = magnetUris.map(async (magnet) => {
            try {
                const formData = new FormData();
                formData.append("src", magnet);

                const response = await this.makeRequest<PremiumizeTransferCreateResponse>("/transfer/create", {
                    method: "POST",
                    body: formData,
                });

                return {
                    magnet,
                    status: {
                        id: response.id,
                        success: true,
                        message: response.name ? `Added: ${response.name}` : "Torrent added successfully",
                        is_cached: response.type === "cached",
                    },
                };
            } catch (error) {
                return {
                    magnet,
                    status: {
                        success: false,
                        message: error instanceof Error ? error.message : `Failed to add torrent ${magnet}`,
                        is_cached: false,
                    },
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
                        message: result.reason?.message || `Failed to add torrent ${magnet}`,
                        is_cached: false,
                    };
                }
                return acc;
            },
            {} as Record<string, DebridFileAddStatus>
        );
    }

    async uploadTorrentFiles(files: File[]): Promise<Record<string, DebridFileAddStatus>> {
        const promises = files.map(async (file) => {
            try {
                const formData = new FormData();
                formData.append("file", file);

                const response = await this.makeRequest<PremiumizeTransferCreateResponse>("/transfer/create", {
                    method: "POST",
                    body: formData,
                });

                return {
                    fileName: file.name,
                    status: {
                        id: response.id,
                        success: true,
                        message: response.name ? `Added: ${response.name}` : "Torrent added successfully",
                        is_cached: response.type === "cached",
                    } as DebridFileAddStatus,
                };
            } catch (error) {
                return {
                    fileName: file.name,
                    status: {
                        success: false,
                        message: error instanceof Error ? error.message : `Failed to add torrent ${file.name}`,
                        is_cached: false,
                    },
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
                        message: result.reason?.message || `Failed to add torrent ${file.name}`,
                        is_cached: false,
                    };
                }
                return acc;
            },
            {} as Record<string, DebridFileAddStatus>
        );
    }

    /**
     * Check if items (magnets, links) are cached on Premiumize
     */
    async checkCache(items: string[]): Promise<{ cached: boolean; filename: string; filesize: string }[]> {
        const params = new URLSearchParams();
        items.forEach((item) => params.append("items[]", item));

        const response = await this.makeRequest<PremiumizeCacheCheckResponse>(`/cache/check?${params.toString()}`);

        return items.map((_, index) => ({
            cached: response.response?.[index] || false,
            filename: response.filename?.[index] || "",
            filesize: response.filesize?.[index] || "0",
        }));
    }

    /**
     * Clear all finished transfers
     */
    async clearFinishedTransfers(): Promise<void> {
        await this.makeRequest<PremiumizeApiResponse>("/transfer/clearfinished", {
            method: "POST",
        });
    }

    private mapTransferToDebridFile(transfer: PremiumizeTransfer): DebridFile {
        const status = this.mapTransferStatus(transfer.status);

        return {
            id: transfer.id,
            name: transfer.name,
            size: 0, // Transfers don't include size in list
            status,
            progress: (transfer.progress || 0) * 100,
            createdAt: new Date(),
            error: transfer.message && status === "failed" ? transfer.message : undefined,
            files: undefined,
        };
    }

    private mapItemToDebridFile(item: PremiumizeItem): DebridFile {
        return {
            id: item.id,
            name: item.name,
            size: item.size || 0,
            status: "completed",
            progress: 100,
            createdAt: item.created_at ? new Date(item.created_at * 1000) : new Date(),
            completedAt: item.created_at ? new Date(item.created_at * 1000) : undefined,
            files:
                item.link || item.stream_link
                    ? [
                          {
                              id: item.id,
                              name: item.name,
                              size: item.size,
                              type: "file" as const,
                              children: [],
                          },
                      ]
                    : undefined,
        };
    }

    private mapItemDetailsToDebridFile(item: PremiumizeItemDetails): DebridFile {
        return {
            id: item.id,
            name: item.name,
            size: item.size || 0,
            status: "completed",
            progress: 100,
            createdAt: item.created_at ? new Date(item.created_at * 1000) : new Date(),
            completedAt: item.created_at ? new Date(item.created_at * 1000) : undefined,
            files: [
                {
                    id: item.id,
                    name: item.name,
                    size: item.size,
                    type: "file" as const,
                    children: [],
                },
            ],
        };
    }

    private mapListAllFileToDebridFile(file: PremiumizeItemListAllFile): DebridFile {
        // Use path for display name to show folder context, or just name if no path
        const displayName = file.path || file.name;

        return {
            id: file.id,
            name: displayName,
            size: file.size || 0,
            status: "completed",
            progress: 100,
            createdAt: file.created_at ? new Date(file.created_at * 1000) : new Date(),
            completedAt: file.created_at ? new Date(file.created_at * 1000) : undefined,
            files: [
                {
                    id: file.id,
                    name: file.name,
                    size: file.size,
                    type: "file" as const,
                    children: [],
                },
            ],
        };
    }

    private mapTransferStatus(status: PremiumizeTransferStatus): DebridFileStatus {
        const statusMap: Record<PremiumizeTransferStatus, DebridFileStatus> = {
            waiting: "waiting",
            queued: "waiting",
            running: "downloading",
            seeding: "seeding",
            finished: "completed",
            error: "failed",
            banned: "failed",
            timeout: "failed",
            deleted: "inactive",
        };

        return statusMap[status] || "unknown";
    }

    private convertItemsToNodes(items: PremiumizeItem[]): DebridNode[] {
        return items.map((item): DebridNode => {
            if (item.type === "folder") {
                return {
                    name: item.name,
                    size: undefined,
                    type: "folder",
                    children: [], // Premiumize API requires separate /folder/list call per folder
                };
            }

            return {
                id: item.id,
                name: item.name,
                size: item.size,
                type: "file",
                children: [],
            };
        });
    }

    // Web download methods - uses /transfer/create to add links as transfers
    async addWebDownloads(links: string[]): Promise<WebDownloadAddResult[]> {
        const results: WebDownloadAddResult[] = [];

        for (const link of links) {
            try {
                const formData = new FormData();
                formData.append("src", link);

                const response = await this.makeRequest<PremiumizeTransferCreateResponse>("/transfer/create", {
                    method: "POST",
                    body: formData,
                });

                results.push({
                    link,
                    success: true,
                    id: response.id,
                    name: response.name || link,
                });
            } catch (error) {
                results.push({
                    link,
                    success: false,
                    error: error instanceof Error ? error.message : "Unknown error",
                });
            }
        }

        return results;
    }

    async getWebDownloadList({ offset, limit }: { offset: number; limit: number }): Promise<WebDownloadList> {
        const response = await this.makeRequest<PremiumizeTransferListResponse>("/transfer/list");

        // Filter transfers that are HTTP downloads (not magnets)
        const httpTransfers = (response.transfers || []).filter(
            (t) => t.src && t.src.startsWith("http") && !t.src.startsWith("magnet:")
        );

        const total = httpTransfers.length;
        const paginated = httpTransfers.slice(offset, offset + limit);

        // Fetch download links for finished transfers with file_id
        const finishedWithFileId = paginated.filter(
            (t) => (t.status === "finished" || t.status === "seeding") && t.file_id
        );
        const downloadLinks = new Map<string, string>();

        if (finishedWithFileId.length > 0) {
            const itemDetailsPromises = finishedWithFileId.map(async (t) => {
                try {
                    const itemResponse = await this.makeRequest<PremiumizeItemDetails>(`/item/details?id=${t.file_id}`);
                    if (itemResponse.link) {
                        downloadLinks.set(t.id, itemResponse.link);
                    }
                } catch {
                    // Ignore errors fetching individual item details
                }
            });
            await Promise.all(itemDetailsPromises);
        }

        return {
            downloads: paginated.map((t) => ({
                id: t.id,
                name: t.name,
                originalLink: t.src || "",
                status: this.mapTransferToWebDownloadStatus(t.status),
                progress: (t.progress || 0) * 100,
                createdAt: new Date(),
                error: t.message && t.status === "error" ? t.message : undefined,
                downloadLink: downloadLinks.get(t.id),
            })),
            offset,
            limit,
            hasMore: offset + limit < total,
            total,
        };
    }

    private mapTransferToWebDownloadStatus(status: PremiumizeTransferStatus): WebDownloadStatus {
        const statusMap: Record<PremiumizeTransferStatus, WebDownloadStatus> = {
            waiting: "pending",
            queued: "pending",
            running: "processing",
            seeding: "completed",
            finished: "completed",
            error: "failed",
            banned: "failed",
            timeout: "failed",
            deleted: "failed",
        };
        return statusMap[status] || "pending";
    }

    async deleteWebDownload(id: string): Promise<void> {
        const formData = new URLSearchParams();
        formData.append("id", id);

        await this.makeRequest<PremiumizeApiResponse>("/transfer/delete", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: formData,
        });
    }
}
