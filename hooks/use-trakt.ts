import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { traktClient } from "@/lib/trakt";

// Cache duration constants
const CACHE_DURATION = {
    SHORT: 5 * 60 * 1000, // 5 minutes
    STANDARD: 6 * 60 * 60 * 1000, // 6 hours
    LONG: 24 * 60 * 60 * 1000, // 24 hours
} as const;

// Generic Trakt query hook factory
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function createTraktHook<T extends any[], R>(
    keyParts: string[],
    fn: (...args: T) => Promise<R>,
    cacheDuration: number
) {
    return (...args: T): UseQueryResult<R> => {
        return useQuery({
            queryKey: ["trakt", ...keyParts, ...args],
            queryFn: () => fn(...args),
            staleTime: cacheDuration,
        });
    };
}

// List hooks - significantly reduced code
export const useTraktTrendingMovies = createTraktHook(
    ["movies", "trending"],
    (limit = 20) => traktClient.getTrendingMovies(limit),
    CACHE_DURATION.STANDARD
);

export const useTraktTrendingShows = createTraktHook(
    ["shows", "trending"],
    (limit = 20) => traktClient.getTrendingShows(limit),
    CACHE_DURATION.STANDARD
);

export const useTraktPopularMovies = createTraktHook(
    ["movies", "popular"],
    (limit = 20) => traktClient.getPopularMovies(limit),
    CACHE_DURATION.STANDARD
);

export const useTraktPopularShows = createTraktHook(
    ["shows", "popular"],
    (limit = 20) => traktClient.getPopularShows(limit),
    CACHE_DURATION.STANDARD
);

export const useTraktMostWatchedMovies = createTraktHook(
    ["movies", "watched"],
    (period = "weekly", limit = 20) => traktClient.getMostWatchedMovies(period, limit),
    CACHE_DURATION.STANDARD
);

export const useTraktMostWatchedShows = createTraktHook(
    ["shows", "watched"],
    (period = "weekly", limit = 20) => traktClient.getMostWatchedShows(period, limit),
    CACHE_DURATION.STANDARD
);

export const useTraktAnticipatedMovies = createTraktHook(
    ["movies", "anticipated"],
    (limit = 20) => traktClient.getAnticipatedMovies(limit),
    CACHE_DURATION.STANDARD
);

export const useTraktAnticipatedShows = createTraktHook(
    ["shows", "anticipated"],
    (limit = 20) => traktClient.getAnticipatedShows(limit),
    CACHE_DURATION.STANDARD
);

export const useTraktBoxOfficeMovies = createTraktHook(
    ["movies", "boxoffice"],
    () => traktClient.getBoxOfficeMovies(),
    CACHE_DURATION.STANDARD
);

// Details hooks
export const useTraktMovieDetails = createTraktHook(
    ["movie"],
    (slug: string) => traktClient.getMovie(slug),
    CACHE_DURATION.LONG
);

export const useTraktShowDetails = createTraktHook(
    ["show"],
    (slug: string) => traktClient.getShow(slug),
    CACHE_DURATION.LONG
);

export const useTraktShowSeasons = createTraktHook(
    ["show", "seasons"],
    (slug: string) => traktClient.getShowSeasons(slug),
    CACHE_DURATION.LONG
);

export const useTraktSeasonEpisodes = createTraktHook(
    ["season", "episodes"],
    (slug: string, season: number) => traktClient.getShowEpisodes(slug, season),
    CACHE_DURATION.LONG
);

// Aliases for backward compatibility
export const useTraktMostPlayedMovies = useTraktMostWatchedMovies;
export const useTraktMostPlayedShows = useTraktMostWatchedShows;

// Combined hooks
export function useTraktTrendingMixed(limit = 20) {
    return useQuery({
        queryKey: ["trakt", "mixed", "trending", limit],
        queryFn: () => traktClient.getTrendingMixed(limit),
        staleTime: CACHE_DURATION.STANDARD,
    });
}

export function useTraktMedia(slug: string, type: "movie" | "show") {
    return useQuery({
        queryKey: ["trakt", "media", slug, type],
        queryFn: () => (type === "movie" ? traktClient.getMovie(slug) : traktClient.getShow(slug)),
        staleTime: CACHE_DURATION.LONG,
    });
}

export const useTraktShowEpisodes = useTraktSeasonEpisodes;

export function useTraktPeople(id: string, type: "movies" | "shows" = "movies") {
    return useQuery({
        queryKey: ["trakt", "people", id, type],
        queryFn: () => traktClient.getPeople(id, type),
        staleTime: CACHE_DURATION.LONG,
    });
}

export const useTraktPerson = createTraktHook(
    ["person"],
    (slug: string) => traktClient.getPerson(slug),
    CACHE_DURATION.LONG
);

export const useTraktPersonMovies = createTraktHook(
    ["person", "movies"],
    (slug: string) => traktClient.getPersonMovies(slug),
    CACHE_DURATION.LONG
);

export const useTraktPersonShows = createTraktHook(
    ["person", "shows"],
    (slug: string) => traktClient.getPersonShows(slug),
    CACHE_DURATION.LONG
);
