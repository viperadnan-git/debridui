// Types and Interfaces
export interface TraktIds {
    trakt: number;
    slug: string;
    tvdb?: number;
    imdb?: string;
    tmdb: number;
}

export interface TraktMedia {
    title: string;
    year: number;
    ids?: TraktIds;
    images?: TraktImages;
    overview?: string;
    rating?: number;
    votes?: number;
    runtime?: number;
    genres?: string[];
    language?: string;
    country?: string;
    trailer?: string;
    homepage?: string;
    status?: string;
    aired_episodes?: number;
    certification?: string;
}

export interface TraktSeason {
    number: number;
    ids: TraktIds;
    images?: TraktImages;
    title?: string;
    overview?: string;
    rating?: number;
    votes?: number;
    episode_count?: number;
    aired_episodes?: number;
    first_aired?: string;
}

export interface TraktEpisode {
    season: number;
    number: number;
    title: string;
    ids: TraktIds;
    images?: TraktImages;
    number_abs?: number;
    overview?: string;
    first_aired?: string; // ISO date
    updated_at?: string; // ISO date
    rating?: number;
    votes?: number;
    comment_count?: number;
    available_translations?: string[]; // ISO language codes (en, es, fr, de, etc.)
    runtime?: number;
    episode_type?: string; // standard, series_premiere, mid_season_finale, mid_season_premiere, season_finale, series_finale
    original_title?: string;
}

export interface TraktImages {
    fanart: string[];
    poster: string[];
    logo: string[];
    clearart: string[];
    banner: string[];
    thumb: string[];
    headshot: string[];
    screenshot: string[];
}

export interface TraktPerson {
    name: string;
    ids: TraktIds;
    images?: Pick<TraktImages, "headshot" | "fanart">;
}

export interface TraktCastMember {
    characters: string[];
    person: TraktPerson;
    episode_count?: number; // only for shows
}

export interface TraktCrewMember {
    jobs?: string[];
    job?: string[];
    person: TraktPerson;
}

export interface TraktCrew {
    production?: TraktCrewMember[];
    art?: TraktCrewMember[];
    crew?: TraktCrewMember[];
    "costume & make-up"?: TraktCrewMember[];
    directing?: TraktCrewMember[];
    writing?: TraktCrewMember[];
    sound?: TraktCrewMember[];
    camera?: TraktCrewMember[];
}

export interface TraktCastAndCrew {
    cast: TraktCastMember[];
    crew: TraktCrew;
}

export interface TraktMediaItem {
    movie?: TraktMedia;
    show?: TraktMedia;
    watchers?: number;
    plays?: number;
    collected?: number;
    collectors?: number;
}

export interface TraktSearchResult {
    type: "movie" | "show" | "episode" | "person";
    score: number;
    movie?: TraktMedia;
    show?: TraktMedia;
}

export interface TraktUserProfile {
    username: string;
    private: boolean;
    name: string;
    vip: boolean;
    vip_ep: boolean;
    ids: {
        slug: string;
        uuid: string;
    };
    joined_at: string;
    location: string;
    about: string;
    gender: string;
    age: number;
    images: {
        avatar: {
            full: string;
        };
    };
    vip_og: boolean;
    vip_years: number;
}

export interface TraktUserAccount {
    timezone: string;
    date_format: string;
    time_24hr: boolean;
    cover_image: string;
}

export interface TraktUserSettings {
    user: TraktUserProfile;
    account: TraktUserAccount;
    sharing_text: {
        watching: string;
        watched: string;
        rated: string;
    };
    limits: {
        list: {
            count: number;
            item_count: number;
        };
        watchlist: {
            item_count: number;
        };
        favorites: {
            item_count: number;
        };
    };
}

export interface TraktListIds {
    trakt: number;
    slug: string;
}

export interface TraktListUser {
    username: string;
    private: boolean;
    name: string;
    vip: boolean;
    vip_ep: boolean;
    ids: {
        slug: string;
    };
}

export interface TraktList {
    name: string;
    description: string;
    privacy: string;
    share_link: string;
    type: string;
    display_numbers: boolean;
    allow_comments: boolean;
    sort_by: string;
    sort_how: string;
    created_at: string;
    updated_at: string;
    item_count: number;
    comment_count: number;
    likes: number;
    ids: TraktListIds;
    user: TraktListUser;
}

export interface TraktListContainer {
    list: TraktList;
}

export interface TraktWatchlistItem {
    rank: number;
    id: number;
    listed_at: string;
    notes: string | null;
    type: "movie" | "show";
    movie?: TraktMedia;
    show?: TraktMedia;
}

export interface TraktCollectionItem {
    last_collected_at: string;
    last_updated_at: string;
    movie?: TraktMedia;
    show?: TraktMedia;
}

export type MediaType = "movie" | "show";
export type MediaTypeEndpoint = "movies" | "shows";

// Configuration interface
export interface TraktClientConfig {
    clientId: string;
    accessToken?: string;
    baseUrl?: string;
    apiVersion?: string;
}

// Error classes
export class TraktError extends Error {
    constructor(
        message: string,
        public status?: number,
        public endpoint?: string
    ) {
        super(message);
        this.name = "TraktError";
    }
}

export class TraktClient {
    private readonly baseUrl: string;
    private readonly clientId: string;
    private readonly apiVersion: string;
    private accessToken?: string;

    constructor(config: TraktClientConfig) {
        this.baseUrl = config.baseUrl || "https://api.trakt.tv";
        this.clientId = config.clientId;
        console.log(this.clientId);
        this.accessToken = config.accessToken;
        this.apiVersion = config.apiVersion || "2";
    }

    /**
     * Set or update the access token for authenticated requests
     */
    public setAccessToken(token: string): void {
        this.accessToken = token;
    }

    /**
     * Get the current access token
     */
    public getAccessToken(): string | undefined {
        return this.accessToken;
    }

    /**
     * Create headers for API requests
     */
    private createHeaders(requiresAuth = false): HeadersInit {
        const headers: HeadersInit = {
            "Content-Type": "application/json",
            "trakt-api-version": this.apiVersion,
            "trakt-api-key": this.clientId,
        };

        if (requiresAuth) {
            if (!this.accessToken) {
                throw new TraktError(
                    "Access token is required for this operation"
                );
            }
            headers["Authorization"] = `Bearer ${this.accessToken}`;
        }

        return headers;
    }

    /**
     * Make HTTP request to Trakt API
     */
    private async makeRequest<T>(
        endpoint: string,
        options: RequestInit = {},
        requiresAuth = false,
        extended?: string
    ): Promise<T> {
        let url = `${this.baseUrl}/${endpoint.replace(/^\//, "")}`;

        // Add extended parameter if provided
        if (extended) {
            const separator = url.includes("?") ? "&" : "?";
            url = `${url}${separator}extended=${extended}`;
        }

        try {
            const response = await fetch(url, {
                ...options,
                headers: {
                    ...this.createHeaders(requiresAuth),
                    ...options.headers,
                },
            });

            if (!response.ok) {
                throw new TraktError(
                    `API request failed: ${response.statusText}`,
                    response.status,
                    endpoint
                );
            }

            // Handle empty responses (204 No Content)
            if (response.status === 204) {
                return {} as T;
            }

            const data = await response.json();
            return data as T;
        } catch (error) {
            if (error instanceof TraktError) {
                throw error;
            }
            throw new TraktError(
                `Request failed: ${error instanceof Error ? error.message : "Unknown error"}`,
                undefined,
                endpoint
            );
        }
    }

    /**
     * Make paginated requests to fetch all items
     */
    private async makePaginatedRequest<T>(
        endpoint: string,
        params: Record<string, string | number> = {},
        requiresAuth = false,
        limit = 100
    ): Promise<T[]> {
        let page = 1;
        let allItems: T[] = [];

        while (true) {
            const searchParams = new URLSearchParams({
                ...Object.fromEntries(
                    Object.entries(params).map(([key, value]) => [
                        key,
                        String(value),
                    ])
                ),
                page: String(page),
                limit: String(limit),
            });

            const paginatedEndpoint = `${endpoint}?${searchParams}`;
            const items = await this.makeRequest<T[]>(
                paginatedEndpoint,
                {},
                requiresAuth
            );

            if (items.length === 0) break;

            allItems = [...allItems, ...items];
            if (items.length < limit) break;

            page++;
        }

        return allItems;
    }

    // Search Methods
    /**
     * Search for movies and shows
     */
    public async search(
        query: string,
        types: MediaType[] = ["movie", "show"],
        extended = "images"
    ): Promise<TraktSearchResult[]> {
        if (!query.trim()) {
            return [];
        }

        const typeParam = types.join(",");
        const endpoint = `search/${typeParam}?query=${encodeURIComponent(query)}`;

        return this.makeRequest<TraktSearchResult[]>(endpoint, {}, false, extended);
    }

    // Generic Media Methods
    /**
     * Get media data from any endpoint
     */
    public async getMediaData(endpoint: string): Promise<TraktMediaItem[]> {
        return this.makeRequest<TraktMediaItem[]>(endpoint);
    }

    /**
     * Get trending media by genre
     */
    public async getTrendingByGenre(
        genre: string,
        type: MediaTypeEndpoint,
        limit = 20
    ): Promise<TraktMediaItem[]> {
        const endpoint = `${type}/trending?genres=${genre}&limit=${limit}`;
        return this.makeRequest<TraktMediaItem[]>(endpoint);
    }

    /**
     * Get popular media by genre
     */
    public async getPopularByGenre(
        genre: string,
        type: MediaTypeEndpoint,
        limit = 20
    ): Promise<TraktMediaItem[]> {
        const endpoint = `${type}/popular?genres=${genre}&limit=${limit}`;
        const response = await this.makeRequest<TraktMedia[]>(endpoint);

        // Transform response to match expected format
        return response.map((item) => ({
            [type === "movies" ? "movie" : "show"]: {
                title: item.title,
                year: item.year,
                ids: item.ids,
            },
        }));
    }

    // User Methods
    /**
     * Get current user settings (requires authentication)
     */
    public async getUserSettings(): Promise<TraktUserSettings> {
        return this.makeRequest<TraktUserSettings>("users/settings", {}, true);
    }

    /**
     * Get user's personal lists
     */
    public async getUserLists(userSlug: string): Promise<TraktList[]> {
        return this.makePaginatedRequest<TraktList>(
            `users/${userSlug}/lists`,
            {},
            true
        );
    }

    /**
     * Get user's liked lists
     */
    public async getLikedLists(
        userSlug: string
    ): Promise<TraktListContainer[]> {
        return this.makePaginatedRequest<TraktListContainer>(
            `users/${userSlug}/likes/lists`,
            {},
            true
        );
    }

    /**
     * Get items from a specific list
     */
    public async getListItems(
        userSlug: string,
        listId: number,
        type?: MediaType
    ): Promise<TraktMediaItem[]> {
        const endpoint = type
            ? `users/${userSlug}/lists/${listId}/items/${type}`
            : `users/${userSlug}/lists/${listId}/items`;

        return this.makePaginatedRequest<TraktMediaItem>(endpoint, {}, true);
    }

    // Watchlist Methods
    /**
     * Get watchlist movies
     */
    public async getWatchlistMovies(): Promise<TraktWatchlistItem[]> {
        return this.makeRequest<TraktWatchlistItem[]>(
            "sync/watchlist/movies/added",
            {},
            true
        );
    }

    /**
     * Get watchlist shows
     */
    public async getWatchlistShows(): Promise<TraktWatchlistItem[]> {
        return this.makeRequest<TraktWatchlistItem[]>(
            "sync/watchlist/shows/added",
            {},
            true
        );
    }

    /**
     * Get all watchlist items (movies and shows)
     */
    public async getWatchlist(): Promise<{
        movies: TraktWatchlistItem[];
        shows: TraktWatchlistItem[];
    }> {
        const [movies, shows] = await Promise.all([
            this.getWatchlistMovies(),
            this.getWatchlistShows(),
        ]);

        return { movies, shows };
    }

    // Collection Methods
    /**
     * Get collection movies
     */
    public async getCollectionMovies(): Promise<TraktCollectionItem[]> {
        return this.makeRequest<TraktCollectionItem[]>(
            "sync/collection/movies",
            {},
            true
        );
    }

    /**
     * Get collection shows
     */
    public async getCollectionShows(): Promise<TraktCollectionItem[]> {
        return this.makeRequest<TraktCollectionItem[]>(
            "sync/collection/shows",
            {},
            true
        );
    }

    /**
     * Get all collection items (movies and shows)
     */
    public async getCollection(): Promise<{
        movies: TraktCollectionItem[];
        shows: TraktCollectionItem[];
    }> {
        const [movies, shows] = await Promise.all([
            this.getCollectionMovies(),
            this.getCollectionShows(),
        ]);

        return { movies, shows };
    }

    // Convenience Methods
    /**
     * Get trending movies
     */
    public async getTrendingMovies(
        limit = 20,
        extended = "full,images"
    ): Promise<TraktMediaItem[]> {
        return this.makeRequest<TraktMediaItem[]>(
            `movies/trending?limit=${limit}`,
            {},
            false,
            extended
        );
    }

    /**
     * Get trending shows
     */
    public async getTrendingShows(
        limit = 20,
        extended = "full,images"
    ): Promise<TraktMediaItem[]> {
        return this.makeRequest<TraktMediaItem[]>(
            `shows/trending?limit=${limit}`,
            {},
            false,
            extended
        );
    }

    /**
     * Get popular movies
     */
    public async getPopularMovies(
        limit = 20,
        extended = "full,images"
    ): Promise<TraktMediaItem[]> {
        const movies = await this.makeRequest<TraktMedia[]>(
            `movies/popular?limit=${limit}`,
            {},
            false,
            extended
        );
        return movies.map((movie) => ({ movie }));
    }

    /**
     * Get popular shows
     */
    public async getPopularShows(
        limit = 20,
        extended = "full,images"
    ): Promise<TraktMediaItem[]> {
        const shows = await this.makeRequest<TraktMedia[]>(
            `shows/popular?limit=${limit}`,
            {},
            false,
            extended
        );
        return shows.map((show) => ({ show }));
    }

    /**
     * Get most watched movies
     */
    public async getMostWatchedMovies(
        period = "weekly",
        limit = 20,
        extended = "full,images"
    ): Promise<TraktMediaItem[]> {
        return this.makeRequest<TraktMediaItem[]>(
            `movies/watched/${period}?limit=${limit}`,
            {},
            false,
            extended
        );
    }

    /**
     * Get most watched shows
     */
    public async getMostWatchedShows(
        period = "weekly",
        limit = 20,
        extended = "full,images"
    ): Promise<TraktMediaItem[]> {
        return this.makeRequest<TraktMediaItem[]>(
            `shows/watched/${period}?limit=${limit}`,
            {},
            false,
            extended
        );
    }

    /**
     * Get anticipated movies
     */
    public async getAnticipatedMovies(
        limit = 20,
        extended = "full,images"
    ): Promise<TraktMediaItem[]> {
        return this.makeRequest<TraktMediaItem[]>(
            `movies/anticipated?limit=${limit}`,
            {},
            false,
            extended
        );
    }

    /**
     * Get anticipated shows
     */
    public async getAnticipatedShows(
        limit = 20,
        extended = "full,images"
    ): Promise<TraktMediaItem[]> {
        return this.makeRequest<TraktMediaItem[]>(
            `shows/anticipated?limit=${limit}`,
            {},
            false,
            extended
        );
    }

    /**
     * Get box office movies
     */
    public async getBoxOfficeMovies(
        extended = "full,images"
    ): Promise<TraktMediaItem[]> {
        return this.makeRequest<TraktMediaItem[]>(
            `movies/boxoffice`,
            {},
            false,
            extended
        );
    }

    /**
     * Get movie by ID
     */
    public async getMovie(
        id: string,
        extended = "full,images"
    ): Promise<TraktMedia> {
        return this.makeRequest<TraktMedia>(
            `movies/${id}`,
            {},
            false,
            extended
        );
    }

    /**
     * Get show by ID
     */
    public async getShow(
        id: string,
        extended = "full,images"
    ): Promise<TraktMedia> {
        return this.makeRequest<TraktMedia>(`shows/${id}`, {}, false, extended);
    }

    /**
     * Get show seasons
     */
    public async getShowSeasons(id: string, extended = "full,images"): Promise<TraktSeason[]> {
        return this.makeRequest<TraktSeason[]>(`shows/${id}/seasons`, {}, false, extended);
    }

    /**
     * Get show episodes
     */
    public async getShowEpisodes(
        id: string,
        season: number,
        extended = "full,images"
    ): Promise<TraktEpisode[]> {
        return this.makeRequest<TraktEpisode[]>(
            `shows/${id}/seasons/${season}/episodes`,
            {},
            false,
            extended
        );
    }

    /**
     * Get cast and crew for a movie or show
     */
    public async getPeople(
        id: string,
        type: "movies" | "shows",
        extended = "full,images"
    ): Promise<TraktCastAndCrew> {
        return this.makeRequest<TraktCastAndCrew>(
            `${type}/${id}/people`,
            {},
            false,
            extended
        );
    }

    /**
     * Get recommended movies
     */
    public async getRecommendedMovies(
        limit = 20,
        extended = "full,images"
    ): Promise<TraktMediaItem[]> {
        const movies = await this.makeRequest<TraktMedia[]>(
            `movies/recommended?limit=${limit}`,
            {},
            false,
            extended
        );
        return movies.map((movie) => ({ movie }));
    }

    /**
     * Get recommended shows
     */
    public async getRecommendedShows(
        limit = 20,
        extended = "full,images"
    ): Promise<TraktMediaItem[]> {
        const shows = await this.makeRequest<TraktMedia[]>(
            `shows/recommended?limit=${limit}`,
            {},
            false,
            extended
        );
        return shows.map((show) => ({ show }));
    }

    /**
     * Get most played movies
     */
    public async getMostPlayedMovies(
        period = "weekly",
        limit = 20,
        extended = "full,images"
    ): Promise<TraktMediaItem[]> {
        return this.makeRequest<TraktMediaItem[]>(
            `movies/played/${period}?limit=${limit}`,
            {},
            false,
            extended
        );
    }

    /**
     * Get most played shows
     */
    public async getMostPlayedShows(
        period = "weekly",
        limit = 20,
        extended = "full,images"
    ): Promise<TraktMediaItem[]> {
        return this.makeRequest<TraktMediaItem[]>(
            `shows/played/${period}?limit=${limit}`,
            {},
            false,
            extended
        );
    }
}

export const traktClient = new TraktClient({
    clientId: process.env.NEXT_PUBLIC_TRAKT_CLIENT_ID!,
});
