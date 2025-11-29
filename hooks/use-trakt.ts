import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { traktClient } from "@/lib/trakt";

// Cache configuration
const CACHE_TIMES = {
    trending: 6 * 60 * 60 * 1000,
    popular: 6 * 60 * 60 * 1000,
    watched: 6 * 60 * 60 * 1000,
    anticipated: 6 * 60 * 60 * 1000,
    boxoffice: 6 * 60 * 60 * 1000,
    details: 24 * 60 * 60 * 1000,
    search: 5 * 60 * 1000,
};

// Generic Trakt query hook factory
function createTraktHook<T extends any[], R>(
    keyParts: string[],
    fn: (...args: T) => Promise<R>,
    cacheType: keyof typeof CACHE_TIMES
) {
    return (...args: T): UseQueryResult<R> => {
        const cache = CACHE_TIMES[cacheType];
        return useQuery({
            queryKey: ["trakt", ...keyParts, ...args],
            queryFn: () => fn(...args),
            staleTime: cache,
            gcTime: cache * 2,
        });
    };
}

// List hooks - significantly reduced code
export const useTraktTrendingMovies = createTraktHook(
    ["movies", "trending"],
    (limit = 20) => traktClient.getTrendingMovies(limit),
    "trending"
);

export const useTraktTrendingShows = createTraktHook(
    ["shows", "trending"],
    (limit = 20) => traktClient.getTrendingShows(limit),
    "trending"
);

export const useTraktPopularMovies = createTraktHook(
    ["movies", "popular"],
    (limit = 20) => traktClient.getPopularMovies(limit),
    "popular"
);

export const useTraktPopularShows = createTraktHook(
    ["shows", "popular"],
    (limit = 20) => traktClient.getPopularShows(limit),
    "popular"
);

export const useTraktMostWatchedMovies = createTraktHook(
    ["movies", "watched"],
    (period = "weekly", limit = 20) => traktClient.getMostWatchedMovies(period, limit),
    "watched"
);

export const useTraktMostWatchedShows = createTraktHook(
    ["shows", "watched"],
    (period = "weekly", limit = 20) => traktClient.getMostWatchedShows(period, limit),
    "watched"
);

export const useTraktAnticipatedMovies = createTraktHook(
    ["movies", "anticipated"],
    (limit = 20) => traktClient.getAnticipatedMovies(limit),
    "anticipated"
);

export const useTraktAnticipatedShows = createTraktHook(
    ["shows", "anticipated"],
    (limit = 20) => traktClient.getAnticipatedShows(limit),
    "anticipated"
);

export const useTraktBoxOfficeMovies = createTraktHook(
    ["movies", "boxoffice"],
    () => traktClient.getBoxOfficeMovies(),
    "boxoffice"
);

// Details hooks
export const useTraktMovieDetails = createTraktHook(
    ["movie"],
    (slug: string) => traktClient.getMovieDetails(slug),
    "details"
);

export const useTraktMovieSeasons = createTraktHook(
    ["movie", "seasons"],
    (slug: string) => traktClient.getMovieSeasons(slug),
    "details"
);

export const useTraktShowDetails = createTraktHook(
    ["show"],
    (slug: string) => traktClient.getShowDetails(slug),
    "details"
);

export const useTraktShowSeasons = createTraktHook(
    ["show", "seasons"],
    (slug: string) => traktClient.getShowSeasons(slug),
    "details"
);

export const useTraktSeasonEpisodes = createTraktHook(
    ["season", "episodes"],
    (slug: string, season: number) => traktClient.getSeasonEpisodes(slug, season),
    "details"
);

// Search hooks
export const useTraktSearchMovies = createTraktHook(
    ["search", "movies"],
    (query: string) => traktClient.searchMovies(query),
    "search"
);

export const useTraktSearchShows = createTraktHook(
    ["search", "shows"],
    (query: string) => traktClient.searchShows(query),
    "search"
);

export const useTraktSearchId = createTraktHook(
    ["search", "id"],
    (id: string, type?: "imdb" | "tmdb" | "tvdb") => traktClient.searchId(id, type),
    "search"
);

// Aliases for backward compatibility
export const useTraktMostPlayedMovies = useTraktMostWatchedMovies;
export const useTraktMostPlayedShows = useTraktMostWatchedShows;

// Combined hooks
export function useTraktTrendingMixed(limit = 20) {
    const cache = CACHE_TIMES.trending;
    return useQuery({
        queryKey: ["trakt", "mixed", "trending", limit],
        queryFn: () => traktClient.getTrendingMixed(limit),
        staleTime: cache,
        gcTime: cache * 2,
    });
}

export function useTraktSearch(query: string, type?: "movie" | "show") {
    const cache = CACHE_TIMES.search;
    return useQuery({
        queryKey: ["trakt", "search", query, type],
        queryFn: () => traktClient.search(query, type),
        staleTime: cache,
        gcTime: cache * 2,
    });
}

export function useTraktMedia(slug: string, type: "movie" | "show") {
    const cache = CACHE_TIMES.details;
    return useQuery({
        queryKey: ["trakt", "media", slug, type],
        queryFn: () => (type === "movie" ? traktClient.getMovieDetails(slug) : traktClient.getShowDetails(slug)),
        staleTime: cache,
        gcTime: cache * 2,
    });
}

export const useTraktShowEpisodes = useTraktSeasonEpisodes;

export function useTraktPeople(id: string) {
    const cache = CACHE_TIMES.details;
    return useQuery({
        queryKey: ["trakt", "people", id],
        queryFn: () => traktClient.getPeople(id),
        staleTime: cache,
        gcTime: cache * 2,
    });
}
