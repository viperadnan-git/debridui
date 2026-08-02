"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useAuthGuaranteed } from "@/components/auth/auth-provider";
import type TorBoxClient from "@/lib/clients/torbox";
import type { TorBoxSearchResult } from "@/lib/clients/torbox";
import { parseMediaLink } from "@/lib/media/external-links";
import { type TraktSearchResult, traktClient } from "@/lib/trakt";
import { AccountType, type DebridFile } from "@/lib/types";
import { getFindTorrentsCacheKey } from "@/lib/utils/cache-keys";

// Searching is user-initiated: returning to the tab must not silently re-run it. Matters most for
// the file search, whose staleTime of 0 made every focus re-paginate the library.
const NO_REFETCH_ON_FOCUS = { refetchOnWindowFocus: false } as const;

interface UseSearchLogicOptions {
    query: string;
    enabled?: boolean;
}

export interface SearchState {
    linkedResult?: TraktSearchResult;
    linkedSource?: string;
    fileResults?: DebridFile[];
    traktResults?: TraktSearchResult[];
    sourceResults?: TorBoxSearchResult[];
    isFileSearching: boolean;
    isTraktSearching: boolean;
    isSourceSearching: boolean;
    /** Every source that will answer has answered — gates the empty state and the footer */
    isSettled: boolean;
    hasFileResults: boolean;
    hasTraktResults: boolean;
    hasSourceResults: boolean;
    hasAnyResults: boolean;
    totalCount: number;
}

export function useSearchLogic({ query, enabled = true }: UseSearchLogicOptions): SearchState {
    const { client, currentAccount } = useAuthGuaranteed();
    const trimmedQuery = query.trim();
    const minQueryLength = 3;
    const shouldSearch = enabled && trimmedQuery.length >= minQueryLength;

    // A pasted media-database URL resolves on its own track, so it never gates the searches below
    const link = useMemo(() => parseMediaLink(trimmedQuery), [trimmedQuery]);

    const { data: linkMatches, isLoading: isLinkResolving } = useQuery({
        queryKey: ["trakt", "idLookup", link?.idType, link?.id, link?.type],
        queryFn: () => traktClient.idLookup(link!.idType, link!.id, link!.type),
        enabled: !!link,
        ...NO_REFETCH_ON_FOCUS,
        staleTime: 60 * 60 * 1000,
        gcTime: 6 * 60 * 60 * 1000,
    });

    const { data: traktResults, isLoading: isTraktSearching } = useQuery({
        queryKey: ["trakt", "search", query],
        queryFn: () => traktClient.search(query, ["movie", "show"]),
        enabled: shouldSearch,
        ...NO_REFETCH_ON_FOCUS,
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
    });

    const { data: fileResults, isLoading: isFileSearching } = useQuery<DebridFile[]>({
        queryKey: getFindTorrentsCacheKey(currentAccount.id, query),
        queryFn: () => client.findTorrents(query),
        enabled: shouldSearch,
        ...NO_REFETCH_ON_FOCUS,
        staleTime: 0,
        gcTime: 60_000,
    });

    const isTorBoxUser = currentAccount.type === AccountType.TORBOX;

    const { data: sourceResults, isLoading: isSourceSearching } = useQuery<TorBoxSearchResult[]>({
        queryKey: ["torbox", "search", currentAccount.id, query],
        queryFn: () => (client as TorBoxClient).searchTorrents(query),
        enabled: shouldSearch && isTorBoxUser,
        ...NO_REFETCH_ON_FOCUS,
        staleTime: 60 * 60 * 1000,
        gcTime: 6 * 60 * 60 * 1000,
    });

    const linkedResult = linkMatches?.[0];
    const hasFileResults = !!fileResults?.length;
    const hasTraktResults = !!traktResults?.length;
    const hasSourceResults = isTorBoxUser && !!sourceResults?.length;

    return {
        linkedResult,
        linkedSource: link?.source,
        fileResults,
        traktResults,
        sourceResults: isTorBoxUser ? sourceResults : undefined,
        isFileSearching,
        isTraktSearching,
        isSourceSearching: isTorBoxUser ? isSourceSearching : false,
        // Waiting on the link too, so the empty state cannot flash before it resolves
        isSettled:
            !isFileSearching &&
            !isTraktSearching &&
            (!isTorBoxUser || !isSourceSearching) &&
            !(link && isLinkResolving),
        hasFileResults,
        hasTraktResults,
        hasSourceResults,
        hasAnyResults: !!linkedResult || hasFileResults || hasTraktResults || hasSourceResults,
        totalCount:
            (linkedResult ? 1 : 0) +
            (fileResults?.length || 0) +
            (traktResults?.length || 0) +
            (isTorBoxUser ? sourceResults?.length || 0 : 0),
    };
}
