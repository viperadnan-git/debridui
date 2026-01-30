"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuthGuaranteed } from "@/components/auth/auth-provider";
import { getFindTorrentsCacheKey } from "@/lib/utils/cache-keys";
import { type DebridFile, AccountType } from "@/lib/types";
import { traktClient } from "@/lib/trakt";
import type TorBoxClient from "@/lib/clients/torbox";
import type { TorBoxSearchResult } from "@/lib/clients/torbox";

interface UseSearchLogicOptions {
    query: string;
    enabled?: boolean;
}

export function useSearchLogic({ query, enabled = true }: UseSearchLogicOptions) {
    const { client, currentUser, currentAccount } = useAuthGuaranteed();
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
        queryKey: getFindTorrentsCacheKey(currentAccount.id, query),
        queryFn: () => client.findTorrents(query),
        enabled: shouldSearch,
        staleTime: 0,
        gcTime: 60_000,
    });

    const isTorBoxUser = currentUser.type === AccountType.TORBOX;

    const { data: sourceResults, isLoading: isSourceSearching } = useQuery<TorBoxSearchResult[]>({
        queryKey: ["torbox", "search", currentAccount.id, query],
        queryFn: () => (client as TorBoxClient).searchTorrents(query),
        enabled: shouldSearch && isTorBoxUser,
        staleTime: 60 * 60 * 1000,
        gcTime: 6 * 60 * 60 * 1000,
    });

    const hasFileResults = !!fileResults?.length;
    const hasTraktResults = !!traktResults?.length;
    const hasSourceResults = isTorBoxUser && !!sourceResults?.length;
    const bothLoaded = !isFileSearching && !isTraktSearching && (!isTorBoxUser || !isSourceSearching);
    const hasAnyResults = hasFileResults || hasTraktResults || hasSourceResults;

    return {
        fileResults,
        traktResults,
        sourceResults: isTorBoxUser ? sourceResults : undefined,
        isFileSearching,
        isTraktSearching,
        isSourceSearching: isTorBoxUser ? isSourceSearching : false,
        bothLoaded,
        hasFileResults,
        hasTraktResults,
        hasSourceResults,
        hasAnyResults,
    };
}
