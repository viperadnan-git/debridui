"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuthContext } from "@/lib/contexts/auth";
import { getFindTorrentsCacheKey } from "@/lib/utils/cache-keys";
import { type DebridFile } from "@/lib/types";
import { traktClient } from "@/lib/trakt";

interface UseSearchLogicOptions {
    query: string;
    enabled?: boolean;
}

export function useSearchLogic({ query, enabled = true }: UseSearchLogicOptions) {
    const { client, currentUser } = useAuthContext();
    const trimmedQuery = query.trim();
    const minQueryLength = 3;
    const shouldSearch = enabled && trimmedQuery.length >= minQueryLength;

    // Trakt search for movies and TV shows
    const { data: traktResults, isLoading: isTraktSearching } = useQuery({
        queryKey: ["trakt", "search", query],
        queryFn: () => traktClient.search(query, ["movie", "show"]),
        enabled: shouldSearch,
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
    });

    // File search using debrid client
    const { data: fileResults, isLoading: isFileSearching } = useQuery<DebridFile[]>({
        queryKey: getFindTorrentsCacheKey(currentUser.id, query),
        queryFn: () => client.findTorrents(query),
        enabled: shouldSearch,
        staleTime: 0,
        gcTime: 60_000,
    });

    const hasFileResults = !!(fileResults && fileResults.length > 0);
    const hasTraktResults = !!(traktResults && traktResults.length > 0);
    const bothLoaded = !isFileSearching && !isTraktSearching;
    const hasAnyResults = hasFileResults || hasTraktResults;

    return {
        fileResults,
        traktResults,
        isFileSearching,
        isTraktSearching,
        bothLoaded,
        hasFileResults,
        hasTraktResults,
        hasAnyResults,
    };
}
