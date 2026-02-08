import { useSettingsStore } from "@/lib/stores/settings";
import { createTMDBClient, type TMDBEpisodeGroupDetails, type TMDBEpisodeGroupsResponse } from "@/lib/tmdb";
import { useQuery, UseQueryResult } from "@tanstack/react-query";

const CACHE_DURATION = {
    SHORT: 5 * 60 * 1000, // 5 minutes
    STANDARD: 6 * 60 * 60 * 1000, // 6 hours
    LONG: 24 * 60 * 60 * 1000, // 24 hours
} as const;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function createTMDBHook<T extends any[], R>(
    keyParts: string[],
    fn: (client: NonNullable<ReturnType<typeof createTMDBClient>>, ...args: T) => Promise<R>,
    cacheDuration: number,
    argsEnabled?: (...args: T) => boolean
) {
    return (...args: T): UseQueryResult<R> => {
        const apiKey = useSettingsStore((state) => state.get("tmdbApiKey"));

        return useQuery({
            queryKey: ["tmdb", ...keyParts, ...args],
            queryFn: async () => {
                const client = createTMDBClient(apiKey);
                if (!client) {
                    throw new Error("TMDB API key is not configured. Please add your API key in Settings.");
                }
                return fn(client, ...args);
            },
            staleTime: cacheDuration,
            enabled: !!apiKey && (argsEnabled ? argsEnabled(...args) : true),
        });
    };
}

export const useTMDBSeriesEpisodeGroups = createTMDBHook<[number], TMDBEpisodeGroupsResponse>(
    ["series", "episode-groups"],
    (client, seriesId) => client.getTVSeriesEpisodeGroups(seriesId),
    CACHE_DURATION.LONG,
    (seriesId) => !!seriesId
);

export const useTMDBEpisodeGroupDetails = createTMDBHook<[string], TMDBEpisodeGroupDetails>(
    ["episode-group", "details"],
    (client, groupId) => client.getEpisodeGroupDetails(groupId),
    CACHE_DURATION.LONG,
    (groupId) => !!groupId
);
