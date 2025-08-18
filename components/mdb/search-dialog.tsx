"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
    CommandDialog,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { useTraktSearch } from "@/hooks/use-trakt";
import { Search, Film, Tv, Star, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { type TraktSearchResult } from "@/lib/trakt";

interface SearchDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
    const [query, setQuery] = useState("");
    const router = useRouter();

    const { data: searchResults, isLoading } = useTraktSearch(
        query,
        open && query.trim().length > 2
    );

    const sortedResults = useMemo(() => {
        if (!searchResults) return [];

        return searchResults
            .filter(
                (result) =>
                    (result.type === "movie" && result.movie) ||
                    (result.type === "show" && result.show)
            )
            .sort((a, b) => b.score - a.score);
    }, [searchResults]);

    const handleSelect = useCallback((result: TraktSearchResult) => {
        const media = result.movie || result.show;
        if (!media?.ids?.imdb) return;

        const type = result.movie ? "movie" : "show";
        router.push(`/${type}/${media.ids.imdb}`);
        onOpenChange(false);
        setQuery("");
    }, [router, onOpenChange, setQuery]);

    const renderMediaItem = useCallback((result: TraktSearchResult) => {
        const media = result.movie || result.show;
        if (!media) return null;

        const type = result.movie ? "movie" : "show";
        const icon = type === "movie" ? Film : Tv;
        const Icon = icon;

        const posterImage = media.images?.poster?.[0]
            ? `https://${media.images.poster[0]}`
            : media.images?.fanart?.[0]
            ? `https://${media.images.fanart[0]}`
            : media.images?.banner?.[0]
            ? `https://${media.images.banner[0]}`
            : null;

        return (
            <CommandItem
                key={`${type}-${media.ids?.slug || media.title}`}
                value={`${media.title} ${media.year || ""}`}
                onSelect={() => handleSelect(result)}
                className="flex items-center gap-3 p-3 cursor-pointer hover:bg-accent/50 transition-colors">
                {/* Poster thumbnail or icon */}
                <div className="flex-shrink-0 w-16 h-20 bg-muted rounded overflow-hidden">
                    {posterImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={posterImage}
                            alt={media.title}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <Icon className="h-6 w-6 text-muted-foreground" />
                        </div>
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium truncate text-sm">
                            {media.title}
                        </span>
                        <Badge
                            variant="outline"
                            className={cn(
                                "text-xs px-1.5 py-0.5",
                                type === "movie"
                                    ? "border-blue-200 text-blue-700 bg-blue-50 dark:border-blue-800 dark:text-blue-400 dark:bg-blue-950"
                                    : "border-purple-200 text-purple-700 bg-purple-50 dark:border-purple-800 dark:text-purple-400 dark:bg-purple-950"
                            )}>
                            {type === "movie" ? "Movie" : "TV Show"}
                        </Badge>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-muted-foreground mb-1">
                        {media.year && (
                            <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                <span>{media.year}</span>
                            </div>
                        )}
                        {media.rating && (
                            <div className="flex items-center gap-1">
                                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                <span>{media.rating.toFixed(1)}</span>
                            </div>
                        )}
                    </div>

                    {media.overview && (
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                            {media.overview}
                        </p>
                    )}
                </div>
            </CommandItem>
        );
    }, [handleSelect]);

    return (
        <CommandDialog
            open={open}
            onOpenChange={onOpenChange}
            className="rounded-lg shadow-md md:min-w-[450px] top-1/3 md:top-1/2">
            <CommandInput
                placeholder="Search movies and TV shows... (⌘K)"
                value={query}
                onValueChange={setQuery}
                className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            <CommandList className="max-h-[50vh] overflow-y-auto">
                {isLoading && query.trim().length > 2 && (
                    <div className="flex flex-col items-center justify-center p-8 text-sm text-muted-foreground">
                        <Search className="h-8 w-8 animate-spin mb-3 opacity-50" />
                        <span>Searching...</span>
                    </div>
                )}

                {!isLoading &&
                    query.trim().length > 2 &&
                    (!searchResults || searchResults.length === 0) && (
                        <div className="flex flex-col items-center justify-center p-8 text-sm text-muted-foreground">
                            <Search className="h-8 w-8 mb-3 opacity-50" />
                            <span className="font-medium">
                                No results found
                            </span>
                            <span className="text-xs mt-1">
                                Try searching with different keywords
                            </span>
                        </div>
                    )}

                {query.trim().length <= 2 && (
                    <div className="flex flex-col items-center justify-center p-8 text-sm text-muted-foreground">
                        <Search className="h-8 w-8 mb-3 opacity-50" />
                        <span className="font-medium">
                            Start typing to search
                        </span>
                        <span className="text-xs mt-1">
                            Type at least 3 characters
                        </span>
                    </div>
                )}

                {!isLoading && sortedResults.length > 0 && (
                    <CommandGroup heading="Trakt Results">
                        {sortedResults.slice(0, 10).map(renderMediaItem)}
                    </CommandGroup>
                )}
            </CommandList>
        </CommandDialog>
    );
}
