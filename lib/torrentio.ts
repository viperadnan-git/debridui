const userAgent =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
// Types
export interface TorrentioSource {
    title: string;
    folder?: string;
    size: string;
    hash: string;
    peers?: string;
    magnet: string;
}

export interface TorrentioStream {
    title: string;
    infoHash: string;
}

export interface TorrentioResponse {
    streams: TorrentioStream[];
}

export interface TvSearchParams {
    season: number;
    episode: number;
}

export interface TorrentioClientConfig {
    urlPrefix: string;
    timeout?: number;
    userAgent?: string;
}

// Custom error classes
export class TorrentioError extends Error {
    constructor(
        message: string,
        public readonly statusCode?: number,
        public readonly imdbId?: string
    ) {
        super(message);
        this.name = "TorrentioError";
    }
}

export class TorrentioClient {
    private readonly urlPrefix: string;
    private readonly timeout: number;
    private readonly userAgent: string;

    constructor(config: TorrentioClientConfig) {
        let urlPrefix = config.urlPrefix;

        // Trim /manifest.json if present
        if (urlPrefix.endsWith("/manifest.json")) {
            urlPrefix = urlPrefix.slice(0, -"/manifest.json".length);
        }

        this.urlPrefix = urlPrefix;
        this.timeout = config.timeout || 1000 * 60 * 3; // 3 minutes
        this.userAgent = config.userAgent || userAgent;
    }

    /**
     * Build the API URL for requests
     */
    private buildUrl(path: string): string {
        return `${this.urlPrefix}/stream/${path}`;
    }

    /**
     * Process a single stream item from Torrentio response
     */
    private processStream(item: TorrentioStream): TorrentioSource {
        const lines = item.title.split("\n").filter((line) => line.trim());

        let title = "";
        let folder = "";

        // Find the first line with emoji metadata (👤 💾 ⚙️)
        const metadataPattern = /👤|💾|⚙️/;
        const metadataLineIndex = lines.findIndex((line) => metadataPattern.test(line));

        // Get all content lines before the metadata
        const contentLines =
            metadataLineIndex >= 0
                ? lines.slice(0, metadataLineIndex).filter((line) => line.trim())
                : lines.filter((line) => line.trim());

        if (contentLines.length === 0) {
            // No content lines found, fallback to first line
            title = lines[0]?.trim() || "";
        } else if (contentLines.length === 1) {
            // Single content line
            title = contentLines[0].trim();
        } else {
            // Multiple content lines - use the first one as it's typically the folder/main title
            // This handles cases like:
            // Line 1: folder name or main title
            // Line 2: filename
            // Line 3: additional info (audio/subtitle)
            // Line N: metadata with emojis
            folder = contentLines[0].trim();
            title = contentLines[1].trim();
        }

        // Extract the size from the metadata line
        const sizeMatch = item.title.match(/💾\s+(\d+(?:\.\d+)?\s+(GB|MB))/i);
        const peersMatch = item.title.match(/👤\s+(\d+)/i);
        const size = sizeMatch?.[1] || "";
        const peers = peersMatch?.[1];
        const magnet = `magnet:?xt=urn:btih:${item.infoHash}&dn=${title}`;

        return {
            title: title,
            folder,
            size,
            hash: item.infoHash,
            magnet,
            peers,
        };
    }

    /**
     * Create headers for API requests
     */
    private getHeaders(): HeadersInit {
        return {
            accept: "application/json, text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
            "accept-language": "en-US,en;q=0.5",
            "accept-encoding": "gzip, deflate, br",
            connection: "keep-alive",
            "sec-fetch-dest": "document",
            "sec-fetch-mode": "navigate",
            "sec-fetch-site": "same-origin",
            "sec-fetch-user": "?1",
            "upgrade-insecure-requests": "1",
            "user-agent": this.userAgent,
        };
    }

    /**
     * Make HTTP request with proper error handling
     */
    private async makeRequest(url: string): Promise<TorrentioResponse> {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        try {
            const response = await fetch(url, {
                headers: this.getHeaders(),
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new TorrentioError(`HTTP ${response.status}: ${response.statusText}`, response.status);
            }

            const contentType = response.headers.get("content-type");
            if (!contentType?.includes("application/json")) {
                throw new TorrentioError("Invalid response format: expected JSON");
            }

            const data = (await response.json()) as TorrentioResponse;

            if (!data.streams || !Array.isArray(data.streams)) {
                throw new TorrentioError("Invalid response structure: missing streams array");
            }

            return data;
        } catch (error) {
            clearTimeout(timeoutId);

            if (error instanceof TorrentioError) {
                throw error;
            }

            if (error instanceof Error) {
                if (error.name === "AbortError") {
                    throw new TorrentioError(`Request timeout after ${this.timeout}ms`);
                }
                throw new TorrentioError(`Network error: ${error.message}`);
            }

            throw new TorrentioError("Unknown error occurred");
        }
    }

    /**
     * Search for movie torrents
     */
    async searchMovie(imdbId: string): Promise<TorrentioSource[]> {
        if (!imdbId?.trim()) {
            throw new TorrentioError("IMDB ID is required");
        }

        try {
            const url = this.buildUrl(`movie/${imdbId}.json`);
            const response = await this.makeRequest(url);

            return response.streams.map((stream) => this.processStream(stream));
        } catch (error) {
            console.error("Movie search error:", error);
            if (error instanceof TorrentioError) {
                throw error;
            }
            throw new TorrentioError(`Failed to search movie ${imdbId}`, undefined, imdbId);
        }
    }

    /**
     * Search for TV show torrents
     */
    async searchTvShow(imdbId: string, params: TvSearchParams = { season: 1, episode: 1 }): Promise<TorrentioSource[]> {
        if (!imdbId?.trim()) {
            throw new TorrentioError("IMDB ID is required");
        }

        if (params.season < 1 || params.episode < 1) {
            throw new TorrentioError("Season and episode must be positive numbers");
        }

        try {
            const url = this.buildUrl(`series/${imdbId}:${params.season}:${params.episode}.json`);
            const response = await this.makeRequest(url);

            return response.streams.map((stream) => this.processStream(stream));
        } catch (error) {
            console.error("TV show search error:", error);
            if (error instanceof TorrentioError) {
                throw error;
            }
            throw new TorrentioError(`Failed to search TV show ${imdbId}`, undefined, imdbId);
        }
    }

    /**
     * Universal search method that handles both movies and TV shows
     */
    async search(imdbId: string, mediaType: "show" | "movie", tvParams?: TvSearchParams): Promise<TorrentioSource[]> {
        switch (mediaType) {
            case "movie":
                return this.searchMovie(imdbId);

            case "show":
                return this.searchTvShow(imdbId, tvParams);

            default:
                throw new TorrentioError(`Unsupported media type: ${mediaType}`);
        }
    }

    /**
     * Get client configuration
     */
    getConfig(): Required<TorrentioClientConfig> {
        return {
            urlPrefix: this.urlPrefix,
            timeout: this.timeout,
            userAgent: this.userAgent,
        };
    }
}
