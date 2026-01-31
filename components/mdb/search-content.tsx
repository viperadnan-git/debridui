"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "@bprogress/next/app";
import { CommandInput, CommandList } from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useSearchLogic } from "@/hooks/use-search-logic";
import { SearchResults } from "./search-results";
import { type DebridFile } from "@/lib/types";
import { type TraktSearchResult } from "@/lib/trakt";
import { cn } from "@/lib/utils";

interface SearchContentProps {
    defaultQuery?: string;
    onClose?: () => void;
    variant?: "modal" | "page";
    className?: string;
    autoFocus?: boolean;
}

export function SearchContent({
    defaultQuery = "",
    onClose,
    variant = "modal",
    className,
    autoFocus = false,
}: SearchContentProps) {
    const router = useRouter();
    const inputRef = useRef<HTMLInputElement>(null);
    const [query, setQuery] = useState(defaultQuery);
    const [debouncedQuery, setDebouncedQuery] = useState(defaultQuery);

    // Debounce the search query
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(query.trim());
        }, 300);

        return () => clearTimeout(timer);
    }, [query]);

    const { fileResults, traktResults, sourceResults, isFileSearching, isTraktSearching, isSourceSearching } =
        useSearchLogic({
            query: debouncedQuery,
            enabled: true,
        });

    const handleFileSelect = useCallback(
        (file: DebridFile) => {
            const searchParams = new URLSearchParams();
            searchParams.set("q", `id:${file.id}`);
            router.push(`/files?${searchParams.toString()}`);

            if (variant === "modal" && onClose) {
                onClose();
                setQuery("");
            }
        },
        [router, onClose, variant]
    );

    const handleMediaSelect = useCallback(
        (result: TraktSearchResult) => {
            const media = result.movie || result.show;
            const slug = media?.ids?.slug || media?.ids?.imdb;
            if (!slug) return;

            const type = result.movie ? "movie" : "show";
            router.push(`/${type}s/${slug}`);

            if (variant === "modal" && onClose) {
                onClose();
                setQuery("");
            }
        },
        [router, onClose, variant]
    );

    if (variant === "modal") {
        return (
            <>
                <CommandInput
                    placeholder="Search movies, TV shows, and files..."
                    value={query}
                    onValueChange={setQuery}
                    autoFocus={autoFocus}
                    className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-11 sm:h-12 text-sm sm:text-base"
                />
                <CommandList className={cn("h-[70vh] sm:h-[75vh] overflow-y-auto", className)}>
                    <SearchResults
                        query={debouncedQuery}
                        fileResults={fileResults}
                        traktResults={traktResults}
                        sourceResults={sourceResults}
                        isFileSearching={isFileSearching}
                        isTraktSearching={isTraktSearching}
                        isSourceSearching={isSourceSearching}
                        onFileSelect={handleFileSelect}
                        onMediaSelect={handleMediaSelect}
                        variant="modal"
                    />
                </CommandList>
            </>
        );
    }

    // Page variant
    return (
        <div className={cn("space-y-8", className)}>
            <form
                className="relative"
                onSubmit={(e) => {
                    e.preventDefault();
                    inputRef.current?.blur();
                }}>
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                    ref={inputRef}
                    type="search"
                    placeholder="Search movies, TV shows, and files..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    autoFocus={autoFocus}
                    className="pl-11 h-12 text-base border-border/50 bg-transparent"
                />
            </form>

            <SearchResults
                query={debouncedQuery}
                fileResults={fileResults}
                traktResults={traktResults}
                sourceResults={sourceResults}
                isFileSearching={isFileSearching}
                isTraktSearching={isTraktSearching}
                isSourceSearching={isSourceSearching}
                onFileSelect={handleFileSelect}
                onMediaSelect={handleMediaSelect}
                variant="page"
            />
        </div>
    );
}
