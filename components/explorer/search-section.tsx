"use client";

import React, { useState, useEffect, memo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuthGuaranteed } from "@/components/auth/auth-provider";
import { SearchBar } from "./search-bar";
import { useSearchParams, useRouter } from "next/navigation";
import { DebridFile } from "@/lib/types";

interface SearchSectionProps {
    onSearchResults: (results: DebridFile[] | null, isSearching: boolean) => void;
}

export const SearchSection = memo(function SearchSection({ onSearchResults }: SearchSectionProps) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const queryParam = searchParams.get("q") || "";
    const [searchQuery, setSearchQuery] = useState<string>(queryParam);
    const { client, currentAccount } = useAuthGuaranteed();

    // Check if this is an ID search
    const isIdSearch = queryParam.trim().startsWith("id:");
    const torrentId = isIdSearch ? queryParam.trim().substring(3) : null;

    // Search files query
    const { data: searchResults, isLoading: isSearching } = useQuery<DebridFile[]>({
        queryKey: [currentAccount.id, isIdSearch ? "findTorrentById" : "findTorrents", queryParam],
        queryFn: async () => {
            if (isIdSearch && torrentId && client.findTorrentById) {
                const result = await client.findTorrentById(torrentId);
                return result ? [result] : [];
            }
            return client.findTorrents(queryParam);
        },
        enabled: !!queryParam && (isIdSearch ? !!client.findTorrentById : true),
        staleTime: 5_000,
    });

    // Update URL when search query changes
    useEffect(() => {
        if (searchQuery === queryParam) return;

        const timer = setTimeout(() => {
            const params = new URLSearchParams(searchParams.toString());
            if (searchQuery) {
                params.set("q", searchQuery);
            } else {
                params.delete("q");
            }
            router.replace(`?${params.toString()}`, { scroll: false });
        }, 750);
        return () => clearTimeout(timer);
    }, [searchQuery, queryParam, searchParams, router]);

    // Update local state when URL param changes
    useEffect(() => {
        setSearchQuery(queryParam);
    }, [queryParam]);

    // Notify parent of search results
    useEffect(() => {
        onSearchResults(queryParam ? (searchResults ?? null) : null, isSearching);
    }, [queryParam, searchResults, isSearching, onSearchResults]);

    return <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search files..." />;
});
