// TMDB Episode Group Types
export interface TMDBEpisodeGroupNetwork {
    id: number;
    logo_path: string | null;
    name: string;
    origin_country: string;
}

export interface TMDBEpisodeGroupResult {
    description: string;
    episode_count: number;
    group_count: number;
    id: string;
    name: string;
    network: TMDBEpisodeGroupNetwork | null;
    type: number;
}

export interface TMDBEpisodeGroupsResponse {
    results: TMDBEpisodeGroupResult[];
    id: number;
}

export interface TMDBEpisodeGroupEpisode {
    air_date: string;
    episode_number: number;
    id: number;
    name: string;
    overview: string;
    production_code: string;
    runtime: number | null;
    season_number: number;
    show_id: number;
    still_path: string | null;
    vote_average: number;
    vote_count: number;
    order: number;
}

export interface TMDBEpisodeGroupGroup {
    id: string;
    name: string;
    order: number;
    episodes: TMDBEpisodeGroupEpisode[];
    locked: boolean;
}

export interface TMDBEpisodeGroupDetails {
    description: string;
    episode_count: number;
    group_count: number;
    groups: TMDBEpisodeGroupGroup[];
    id: string;
    name: string;
    network: TMDBEpisodeGroupNetwork | null;
    type: number;
}

// Configuration interface
export interface TMDBClientConfig {
    apiKey: string;
    baseUrl?: string;
    apiVersion?: string;
}

// Error class
export class TMDBError extends Error {
    constructor(
        message: string,
        public status?: number,
        public endpoint?: string
    ) {
        super(message);
        this.name = "TMDBError";
    }
}

export class TMDBClient {
    private readonly baseUrl: string;
    private readonly apiKey: string;
    private readonly apiVersion: string;

    constructor(config: TMDBClientConfig) {
        this.baseUrl = config.baseUrl || "https://api.themoviedb.org";
        this.apiKey = config.apiKey;
        this.apiVersion = config.apiVersion || "3";
    }

    /**
     * Create headers for API requests
     */
    private createHeaders(): HeadersInit {
        return {
            "Content-Type": "application/json",
            accept: "application/json",
        };
    }

    /**
     * Make HTTP request to TMDB API
     */
    private async makeRequest<T>(
        endpoint: string,
        params: Record<string, string | number> = {},
        options: RequestInit = {}
    ): Promise<T> {
        const searchParams = new URLSearchParams({
            api_key: this.apiKey,
            ...Object.fromEntries(Object.entries(params).map(([key, value]) => [key, String(value)])),
        });

        const url = `${this.baseUrl}/${this.apiVersion}${endpoint}?${searchParams}`;

        try {
            const response = await fetch(url, {
                ...options,
                headers: {
                    ...this.createHeaders(),
                    ...options.headers,
                },
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new TMDBError(
                    errorData.status_message || `API request failed: ${response.statusText}`,
                    response.status,
                    endpoint
                );
            }

            const data = await response.json();
            return data as T;
        } catch (error) {
            if (error instanceof TMDBError) {
                throw error;
            }
            throw new TMDBError(
                `Request failed: ${error instanceof Error ? error.message : "Unknown error"}`,
                undefined,
                endpoint
            );
        }
    }

    /**
     * Get all episode groups for a TV series
     * https://developer.themoviedb.org/reference/tv-series-episode-groups
     */
    public async getTVSeriesEpisodeGroups(seriesId: number): Promise<TMDBEpisodeGroupsResponse> {
        return this.makeRequest<TMDBEpisodeGroupsResponse>(`/tv/${seriesId}/episode_groups`);
    }

    /**
     * Get episode group details including all episodes organized by group
     * https://developer.themoviedb.org/reference/tv-episode-group-details
     */
    public async getEpisodeGroupDetails(groupId: string): Promise<TMDBEpisodeGroupDetails> {
        return this.makeRequest<TMDBEpisodeGroupDetails>(`/tv/episode_group/${groupId}`);
    }
}

// Create TMDB client with API key
export function createTMDBClient(apiKey?: string): TMDBClient | null {
    const key = apiKey;
    if (!key) return null;
    return new TMDBClient({ apiKey: key });
}

export const tmdbClient = createTMDBClient();
