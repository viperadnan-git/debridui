import { useQuery } from "@tanstack/react-query";
import { traktClient } from "@/lib/trakt";

// Cache times
const CACHE_TIMES = {
    trending: 6 * 60 * 60 * 1000, // 6 hours
    popular: 6 * 60 * 60 * 1000, // 6 hours
    watched: 6 * 60 * 60 * 1000, // 6 hours
    anticipated: 6 * 60 * 60 * 1000, // 6 hours
    boxoffice: 6 * 60 * 60 * 1000, // 6 hours
    details: 24 * 60 * 60 * 1000, // 24 hours
    search: 5 * 60 * 1000, // 5 minutes
};

// Trending
export function useTraktTrendingMovies(limit = 20) {
    return useQuery({
        queryKey: ["trakt", "movies", "trending", limit],
        queryFn: () => traktClient.getTrendingMovies(limit),
        staleTime: CACHE_TIMES.trending,
        gcTime: CACHE_TIMES.trending * 2,
    });
}

export function useTraktTrendingShows(limit = 20) {
    return useQuery({
        queryKey: ["trakt", "shows", "trending", limit],
        queryFn: () => traktClient.getTrendingShows(limit),
        staleTime: CACHE_TIMES.trending,
        gcTime: CACHE_TIMES.trending * 2,
    });
}

// Popular
export function useTraktPopularMovies(limit = 20) {
    return useQuery({
        queryKey: ["trakt", "movies", "popular", limit],
        queryFn: () => traktClient.getPopularMovies(limit),
        staleTime: CACHE_TIMES.popular,
        gcTime: CACHE_TIMES.popular * 2,
    });
}

export function useTraktPopularShows(limit = 20) {
    return useQuery({
        queryKey: ["trakt", "shows", "popular", limit],
        queryFn: () => traktClient.getPopularShows(limit),
        staleTime: CACHE_TIMES.popular,
        gcTime: CACHE_TIMES.popular * 2,
    });
}

// Most Watched
export function useTraktMostWatchedMovies(period = "weekly", limit = 20) {
    return useQuery({
        queryKey: ["trakt", "movies", "watched", period, limit],
        queryFn: () => traktClient.getMostWatchedMovies(period, limit),
        staleTime: CACHE_TIMES.watched,
        gcTime: CACHE_TIMES.watched * 2,
    });
}

export function useTraktMostWatchedShows(period = "weekly", limit = 20) {
    return useQuery({
        queryKey: ["trakt", "shows", "watched", period, limit],
        queryFn: () => traktClient.getMostWatchedShows(period, limit),
        staleTime: CACHE_TIMES.watched,
        gcTime: CACHE_TIMES.watched * 2,
    });
}

// Anticipated
export function useTraktAnticipatedMovies(limit = 20) {
    return useQuery({
        queryKey: ["trakt", "movies", "anticipated", limit],
        queryFn: () => traktClient.getAnticipatedMovies(limit),
        staleTime: CACHE_TIMES.anticipated,
        gcTime: CACHE_TIMES.anticipated * 2,
    });
}

export function useTraktAnticipatedShows(limit = 20) {
    return useQuery({
        queryKey: ["trakt", "shows", "anticipated", limit],
        queryFn: () => traktClient.getAnticipatedShows(limit),
        staleTime: CACHE_TIMES.anticipated,
        gcTime: CACHE_TIMES.anticipated * 2,
    });
}

// Box Office
export function useTraktBoxOfficeMovies() {
    return useQuery({
        queryKey: ["trakt", "movies", "boxoffice"],
        queryFn: () => traktClient.getBoxOfficeMovies(),
        staleTime: CACHE_TIMES.boxoffice,
        gcTime: CACHE_TIMES.boxoffice * 2,
    });
}

// Recommended
export function useTraktRecommendedMovies(limit = 20) {
    return useQuery({
        queryKey: ["trakt", "movies", "recommended", limit],
        queryFn: () => traktClient.getRecommendedMovies(limit),
        staleTime: CACHE_TIMES.popular,
        gcTime: CACHE_TIMES.popular * 2,
    });
}

export function useTraktRecommendedShows(limit = 20) {
    return useQuery({
        queryKey: ["trakt", "shows", "recommended", limit],
        queryFn: () => traktClient.getRecommendedShows(limit),
        staleTime: CACHE_TIMES.popular,
        gcTime: CACHE_TIMES.popular * 2,
    });
}

// Most Played
export function useTraktMostPlayedMovies(period = "weekly", limit = 20) {
    return useQuery({
        queryKey: ["trakt", "movies", "played", period, limit],
        queryFn: () => traktClient.getMostPlayedMovies(period, limit),
        staleTime: CACHE_TIMES.watched,
        gcTime: CACHE_TIMES.watched * 2,
    });
}

export function useTraktMostPlayedShows(period = "weekly", limit = 20) {
    return useQuery({
        queryKey: ["trakt", "shows", "played", period, limit],
        queryFn: () => traktClient.getMostPlayedShows(period, limit),
        staleTime: CACHE_TIMES.watched,
        gcTime: CACHE_TIMES.watched * 2,
    });
}

// Get details by ID (supports Trakt ID, Trakt slug, or IMDB ID)
export function useTraktMedia(id: string | undefined, type: "movie" | "show") {
    return useQuery({
        queryKey: ["trakt", type, id],
        queryFn: () => (type === "movie" ? traktClient.getMovie(id!) : traktClient.getShow(id!)),
        enabled: !!id,
        staleTime: CACHE_TIMES.details,
        gcTime: CACHE_TIMES.details * 2,
    });
}

// Get show seasons
export function useTraktShowSeasons(showId: string | undefined) {
    return useQuery({
        queryKey: ["trakt", "show", showId, "seasons"],
        queryFn: () => traktClient.getShowSeasons(showId!),
        enabled: !!showId,
        staleTime: CACHE_TIMES.details,
        gcTime: CACHE_TIMES.details * 2,
    });
}

// Get show episodes for a season
export function useTraktShowEpisodes(showId: string | undefined, season: number | undefined) {
    return useQuery({
        queryKey: ["trakt", "show", showId, "season", season, "episodes"],
        queryFn: () => traktClient.getShowEpisodes(showId!, season!),
        enabled: !!showId && season !== undefined,
        staleTime: CACHE_TIMES.details,
        gcTime: CACHE_TIMES.details * 2,
    });
}

// Get cast and crew
export function useTraktPeople(id: string | undefined, type: "movies" | "shows") {
    return useQuery({
        queryKey: ["trakt", type, id, "people"],
        queryFn: () => traktClient.getPeople(id!, type),
        enabled: !!id,
        staleTime: CACHE_TIMES.details,
        gcTime: CACHE_TIMES.details * 2,
    });
}

// Combined trending for carousel
export function useTraktTrendingMixed(limit = 10) {
    const moviesQuery = useTraktTrendingMovies(limit / 2);
    const showsQuery = useTraktTrendingShows(limit / 2);

    return {
        data: {
            movies: moviesQuery.data || [],
            shows: showsQuery.data || [],
            mixed: [...(moviesQuery.data || []), ...(showsQuery.data || [])].sort(
                (a, b) => (a.plays || 0) - (b.plays || 0)
            ),
        },
        isLoading: moviesQuery.isLoading || showsQuery.isLoading,
        error: moviesQuery.error || showsQuery.error,
    };
}

// Search
export function useTraktSearch(query: string, enabled = true) {
    return useQuery({
        queryKey: ["trakt", "search", query],
        queryFn: () => traktClient.search(query),
        staleTime: CACHE_TIMES.search,
        gcTime: CACHE_TIMES.search * 2,
        enabled: enabled && query.trim().length > 0,
    });
}
