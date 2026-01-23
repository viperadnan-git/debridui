import { AddonError, type AddonManifest, type AddonStreamResponse, type TvSearchParams } from "./types";

const userAgent =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

export interface AddonClientConfig {
    url: string;
    timeout?: number;
    userAgent?: string;
}

export class AddonClient {
    private readonly baseUrl: string;
    private readonly timeout: number;
    private readonly userAgent: string;

    constructor(config: AddonClientConfig) {
        let url = config.url?.trim();

        if (!url) {
            throw new AddonError("Addon URL is required and cannot be empty");
        }

        // Normalize URL - strip /manifest.json if present
        if (url.endsWith("/manifest.json")) {
            url = url.slice(0, -"/manifest.json".length);
        }

        // Remove trailing slash
        if (url.endsWith("/")) {
            url = url.slice(0, -1);
        }

        this.baseUrl = url;
        this.timeout = config.timeout || 1000 * 60 * 3; // 3 minutes
        this.userAgent = config.userAgent || userAgent;
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
    private async makeRequest<T>(url: string): Promise<T> {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        try {
            const response = await fetch(url, {
                headers: this.getHeaders(),
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new AddonError(`HTTP ${response.status}: ${response.statusText}`, response.status);
            }

            const contentType = response.headers.get("content-type");
            if (!contentType?.includes("application/json")) {
                throw new AddonError("Invalid response format: expected JSON");
            }

            const data = (await response.json()) as T;
            return data;
        } catch (error) {
            clearTimeout(timeoutId);

            if (error instanceof AddonError) {
                throw error;
            }

            if (error instanceof Error) {
                if (error.name === "AbortError") {
                    throw new AddonError(`Request timeout after ${this.timeout}ms`);
                }
                throw new AddonError(`Network error: ${error.message}`);
            }

            throw new AddonError("Unknown error occurred");
        }
    }

    /**
     * Fetch addon manifest
     */
    async fetchManifest(): Promise<AddonManifest> {
        const url = `${this.baseUrl}/manifest.json`;
        const manifest = await this.makeRequest<AddonManifest>(url);

        if (!manifest.id || !manifest.name) {
            throw new AddonError("Invalid manifest: missing required fields (id, name)");
        }

        return manifest;
    }

    /**
     * Fetch streams for a movie
     */
    async fetchMovieStreams(imdbId: string): Promise<AddonStreamResponse> {
        if (!imdbId?.trim()) {
            throw new AddonError("IMDB ID is required");
        }

        const url = `${this.baseUrl}/stream/movie/${imdbId}.json`;
        const response = await this.makeRequest<AddonStreamResponse>(url);

        if (!response.streams || !Array.isArray(response.streams)) {
            throw new AddonError("Invalid response structure: missing streams array");
        }

        return response;
    }

    /**
     * Fetch streams for a TV show episode
     */
    async fetchTvStreams(imdbId: string, params: TvSearchParams): Promise<AddonStreamResponse> {
        if (!imdbId?.trim()) {
            throw new AddonError("IMDB ID is required");
        }

        if (params.season < 1 || params.episode < 1) {
            throw new AddonError("Season and episode must be positive numbers");
        }

        const url = `${this.baseUrl}/stream/series/${imdbId}:${params.season}:${params.episode}.json`;
        const response = await this.makeRequest<AddonStreamResponse>(url);

        if (!response.streams || !Array.isArray(response.streams)) {
            throw new AddonError("Invalid response structure: missing streams array");
        }

        return response;
    }

    /**
     * Universal fetch method
     */
    async fetchStreams(
        imdbId: string,
        mediaType: "movie" | "show",
        tvParams?: TvSearchParams
    ): Promise<AddonStreamResponse> {
        if (mediaType === "movie") {
            return this.fetchMovieStreams(imdbId);
        }

        if (!tvParams) {
            throw new AddonError("TV show requires season and episode parameters");
        }

        return this.fetchTvStreams(imdbId, tvParams);
    }

    /**
     * Fetch URL with redirect handling (for URL-only streams)
     */
    async fetchUrlWithRedirect(url: string): Promise<string> {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        try {
            const response = await fetch(url, {
                method: "GET",
                redirect: "follow",
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            // Return final URL after redirects
            return response.url;
        } catch (error) {
            clearTimeout(timeoutId);

            if (error instanceof Error) {
                if (error.name === "AbortError") {
                    throw new AddonError(`Request timeout after ${this.timeout}ms`);
                }
                throw new AddonError(`Failed to fetch URL: ${error.message}`);
            }

            throw new AddonError("Unknown error occurred while fetching URL");
        }
    }

    /**
     * Get base URL
     */
    getBaseUrl(): string {
        return this.baseUrl;
    }
}
