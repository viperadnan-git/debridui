"use client";

import React, { useState, useEffect, memo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuthContext } from "@/lib/contexts/auth";
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
    const { client, currentUser } = useAuthContext();

    // Search files query
    const { data: searchResults, isLoading: isSearching } = useQuery<DebridFile[]>({
        queryKey: [currentUser.id, "findTorrents", queryParam],
        queryFn: () => (client.findTorrents ? client.findTorrents(queryParam) : Promise.resolve([])),
        enabled: !!queryParam && !!client.findTorrents,
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
