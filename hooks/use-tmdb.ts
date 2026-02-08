import { useSettingsStore } from "@/lib/stores/settings";
import { createTMDBClient } from "@/lib/tmdb";
import { useQuery, UseQueryResult } from "@tanstack/react-query";

// Cache duration constants
const CACHE_DURATION = {
    SHORT: 5 * 60 * 1000, // 5 minutes
    STANDARD: 6 * 60 * 60 * 1000, // 6 hours
    LONG: 24 * 60 * 60 * 1000, // 24 hours
} as const;

// Generic TMDB query hook factory
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function createTMDBHook<T extends any[], R>(
    keyParts: string[],
    fn: (client: NonNullable<ReturnType<typeof createTMDBClient>>, ...args: T) => Promise<R>,
    cacheDuration: number
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
            enabled: !!apiKey,
        });
    };
}

/**
 * Hook to fetch all episode groups for a TV series
 * @param seriesId - The TMDB TV series ID
 */
export const useTMDBSeriesEpisodeGroups = createTMDBHook(
    ["series", "episode-groups"],
    (client, seriesId: number) => client.getTVSeriesEpisodeGroups(seriesId),
    CACHE_DURATION.LONG
);

/**
 * Hook to fetch detailed information about a specific episode group
 * @param groupId - The episode group ID
 */
export function useTMDBEpisodeGroupDetails(groupId: string): UseQueryResult<Awaited<ReturnType<InstanceType<typeof import("@/lib/tmdb").TMDBClient>["getEpisodeGroupDetails"]>>> {
    const apiKey = useSettingsStore((state) => state.get("tmdbApiKey"));

    return useQuery({
        queryKey: ["tmdb", "episode-group", "details", groupId],
        queryFn: async () => {
            const client = createTMDBClient(apiKey);
            if (!client) {
                throw new Error("TMDB API key is not configured. Please add your API key in Settings.");
            }
            return client.getEpisodeGroupDetails(groupId);
        },
        staleTime: CACHE_DURATION.LONG,
        enabled: !!apiKey && !!groupId && groupId !== "",
    });
}
