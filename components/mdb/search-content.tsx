"use client";

import { useRouter } from "@bprogress/next/app";
import { Command as CommandPrimitive } from "cmdk";
import { Loader2, Search, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { CommandList } from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { useSearchLogic } from "@/hooks/use-search-logic";
import type { TraktSearchResult } from "@/lib/trakt";
import type { DebridFile } from "@/lib/types";
import { cn } from "@/lib/utils";
import { SearchResults } from "./search-results";

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
    const syncQueryParam = variant === "page";
    const router = useRouter();
    const inputRef = useRef<HTMLInputElement>(null);
    const [query, setQuery] = useState(defaultQuery);
    const [debouncedQuery, setDebouncedQuery] = useState(defaultQuery);

    // Debounce the query and (optionally) mirror it to the URL's `?q=` param
    useEffect(() => {
        const timer = setTimeout(() => {
            const trimmed = query.trim();
            setDebouncedQuery(trimmed);
            if (!syncQueryParam) return;
            const params = new URLSearchParams(window.location.search);
            if ((params.get("q") ?? "") === trimmed) return;
            if (trimmed) params.set("q", trimmed);
            else params.delete("q");
            const qs = params.toString();
            router.replace(qs ? `?${qs}` : window.location.pathname, { scroll: false });
        }, 300);
        return () => clearTimeout(timer);
    }, [query, syncQueryParam, router]);

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

    const modalIsBusy =
        query.trim() !== "" &&
        (query.trim() !== debouncedQuery || isFileSearching || isTraktSearching || isSourceSearching);

    if (variant === "modal") {
        return (
            <>
                <div className="relative border-b border-border/50">
                    {modalIsBusy ? (
                        <Loader2
                            aria-label="Searching"
                            className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 size-4 text-primary animate-spin"
                        />
                    ) : (
                        <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    )}
                    <CommandPrimitive.Input
                        data-slot="command-input"
                        ref={inputRef}
                        placeholder="Movies, TV shows, files..."
                        value={query}
                        onValueChange={setQuery}
                        autoFocus={autoFocus}
                        className="w-full h-11 sm:h-12 lg:h-13 pl-10 sm:pl-11 pr-10 sm:pr-11 bg-transparent text-sm sm:text-base font-light outline-none placeholder:text-muted-foreground/70 [&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none"
                    />
                </div>
                <CommandList className={cn("h-[70vh] sm:h-[75vh] overflow-y-auto", className)}>
                    <SearchResults
                        // Remount whenever the result-set composition changes so cmdk re-registers items in DOM order.
                        // Without this, items registered earlier (e.g. trakt) keep "first" status even after files
                        // mount above them — and cmdk navigates by registration order, not DOM order.
                        key={`${debouncedQuery}:${!!fileResults?.length}:${!!traktResults?.length}:${!!sourceResults?.length}`}
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
    const isBusy =
        query.trim() !== "" &&
        (query.trim() !== debouncedQuery || isFileSearching || isTraktSearching || isSourceSearching);

    return (
        <div className={cn("space-y-8", className)}>
            <form
                className="sticky top-12 z-20 -mx-4 lg:mx-0 px-4 lg:px-0 py-3 bg-background/85 backdrop-blur-md"
                onSubmit={(e) => {
                    e.preventDefault();
                    inputRef.current?.blur();
                }}>
                <div className="relative">
                    {isBusy ? (
                        <Loader2
                            aria-label="Searching"
                            className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 size-4 text-primary animate-spin"
                        />
                    ) : (
                        <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    )}
                    <Input
                        ref={inputRef}
                        type="search"
                        placeholder="Movies, TV shows, files..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        autoFocus={autoFocus}
                        className="pl-10 pr-10 sm:pl-11 sm:pr-11 h-10 sm:h-12 lg:h-13 text-sm sm:text-base lg:text-base font-light border-border/50 bg-card/40 focus-visible:bg-card/60 focus-visible:ring-primary/20 transition-colors [&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none"
                    />
                    {query !== "" && (
                        <button
                            type="button"
                            aria-label="Clear search"
                            onClick={() => {
                                setQuery("");
                                inputRef.current?.focus();
                            }}
                            className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 size-6 sm:size-7 inline-flex items-center justify-center rounded-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer">
                            <X className="size-4" />
                        </button>
                    )}
                </div>
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
