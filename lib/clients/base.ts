import {
    User,
    DebridFileAddStatus,
    DebridFile,
    DebridFileNode,
    DebridLinkInfo,
    WebDownloadAddResult,
    WebDownloadList,
} from "@/lib/types";
import { resolveRedirects } from "@/lib/utils";

/**
 * Sliding-window rate limiter. Serializes calls through a promise chain
 * so concurrent callers never race on the timestamp array.
 */
export class RateLimiter {
    private timestamps: number[] = [];
    private pending: Promise<void> = Promise.resolve();

    constructor(
        private readonly maxRequests: number,
        private readonly intervalMs: number
    ) {}

    acquire(): Promise<void> {
        this.pending = this.pending.then(
            () => this.wait(),
            () => this.wait()
        );
        return this.pending;
    }

    private async wait(): Promise<void> {
        const now = Date.now();
        this.timestamps = this.timestamps.filter((t) => now - t < this.intervalMs);

        if (this.timestamps.length >= this.maxRequests) {
            const delay = this.timestamps[0] + this.intervalMs - now;
            if (delay > 0) {
                await new Promise((r) => setTimeout(r, delay));
            }
        }

        this.timestamps.push(Date.now());
    }
}

interface BaseClientOptions {
    user: User;
    rateLimiter?: { maxRequests: number; intervalMs: number };
}

export default abstract class BaseClient {
    protected readonly user: User;
    protected readonly rateLimiter: RateLimiter;

    // Web download capabilities - override in subclasses
    readonly refreshInterval: number | false = false;
    readonly supportsEphemeralLinks: boolean = false;

    constructor({ user, rateLimiter = { maxRequests: 250, intervalMs: 60000 } }: BaseClientOptions) {
        this.user = user;
        this.rateLimiter = new RateLimiter(rateLimiter.maxRequests, rateLimiter.intervalMs);
    }

    protected async downloadFile(uri: string): Promise<File> {
        const response = await fetch(`/api/proxy/external?url=${encodeURIComponent(uri)}`);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const blob = await response.blob();
        const contentType = response.headers.get("content-type") || "application/x-bittorrent";

        return new File([blob], uri, { type: contentType });
    }

    async addTorrent(uris: string[]): Promise<Record<string, DebridFileAddStatus>> {
        const httpUris: string[] = [];
        const magnetUris: string[] = [];

        for (const uri of uris) {
            const trimmedUri = uri.trim();
            if (trimmedUri.startsWith("http")) {
                httpUris.push(trimmedUri);
            } else {
                magnetUris.push(trimmedUri);
            }
        }

        const [httpResults, magnetResults] = await Promise.allSettled([
            httpUris.length > 0 ? this.addHttpDownloads(httpUris) : Promise.resolve({}),
            magnetUris.length > 0 ? this.addMagnetLinks(magnetUris) : Promise.resolve({}),
        ]);

        const httpData = httpResults.status === "fulfilled" ? httpResults.value : {};
        const magnetData = magnetResults.status === "fulfilled" ? magnetResults.value : {};

        return { ...httpData, ...magnetData };
    }

    protected async addHttpDownloads(httpUris: string[]): Promise<Record<string, DebridFileAddStatus>> {
        const results: Record<string, DebridFileAddStatus> = {};
        const torrentFiles: File[] = [];
        const directLinks: string[] = [];

        await Promise.allSettled(
            httpUris.map(async (uri) => {
                try {
                    const headResponse = await fetch(
                        `/api/proxy/external?url=${encodeURIComponent(uri)}&method=HEAD`
                    );
                    const headData = await headResponse.json();
                    const contentType = headData.contentType || "";
                    const isTorrent =
                        contentType.includes("application/x-bittorrent") ||
                        (contentType.includes("application/octet-stream") && uri.endsWith(".torrent")) ||
                        uri.endsWith(".torrent");

                    if (isTorrent) {
                        const file = await this.downloadFile(uri);
                        torrentFiles.push(file);
                    } else {
                        directLinks.push(uri);
                    }
                } catch (error) {
                    results[uri] = {
                        message: `Failed to process ${uri}: ${error}`,
                        error: error instanceof Error ? error.message : String(error),
                        is_cached: false,
                    };
                }
            })
        );

        if (torrentFiles.length > 0) {
            const uploadResults = await this.uploadTorrentFiles(torrentFiles);
            Object.assign(results, uploadResults);
        }

        if (directLinks.length > 0) {
            const resolvedLinks = await Promise.all(directLinks.map(resolveRedirects));
            const webResults = await this.addWebDownloads(resolvedLinks);
            for (const result of webResults) {
                results[result.link] = {
                    id: result.id,
                    message: result.success ? result.name || "Added successfully" : result.error || "Failed",
                    error: result.success ? undefined : result.error,
                    is_cached: false,
                };
            }
        }

        return results;
    }

    abstract addMagnetLinks(magnetUris: string[]): Promise<Record<string, DebridFileAddStatus>>;
    abstract uploadTorrentFiles(files: File[]): Promise<Record<string, DebridFileAddStatus>>;
    abstract findTorrents(searchQuery: string): Promise<DebridFile[]>;
    abstract findTorrentById?(torrentId: string): Promise<DebridFile | null>;
    abstract getDownloadLink(params: { fileNode: DebridFileNode; resolve?: boolean }): Promise<DebridLinkInfo>;

    // Web download methods
    abstract addWebDownloads(links: string[]): Promise<WebDownloadAddResult[]>;
    abstract getWebDownloadList(params: { offset: number; limit: number }): Promise<WebDownloadList>;
    abstract deleteWebDownload(id: string): Promise<void>;

    // Optional: Save links (AllDebrid only)
    saveWebDownloadLinks?(links: string[]): Promise<void>;
}
