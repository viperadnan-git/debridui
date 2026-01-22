"use client";

import { CommandGroup } from "@/components/ui/command";
import { Search, Loader2 } from "lucide-react";
import { type DebridFile } from "@/lib/types";
import { type TraktSearchResult } from "@/lib/trakt";
import { SearchFileItem } from "./search-file-item";
import { SearchMediaItem } from "./search-media-item";
import { cn } from "@/lib/utils";

interface SearchResultsProps {
    query: string;
    fileResults?: DebridFile[];
    traktResults?: TraktSearchResult[];
    isFileSearching: boolean;
    isTraktSearching: boolean;
    onFileSelect: (file: DebridFile) => void;
    onMediaSelect: (result: TraktSearchResult) => void;
    variant?: "modal" | "page";
    className?: string;
}

export function SearchResults({
    query,
    fileResults,
    traktResults,
    isFileSearching,
    isTraktSearching,
    onFileSelect,
    onMediaSelect,
    variant = "modal",
    className,
}: SearchResultsProps) {
    const trimmedQuery = query.trim();
    const hasFileResults = fileResults && fileResults.length > 0;
    const hasTraktResults = traktResults && traktResults.length > 0;
    const isSearching = trimmedQuery.length > 2;
    const bothLoaded = !isFileSearching && !isTraktSearching;
    const hasAnyResults = hasFileResults || hasTraktResults;

    // Show initial state when query is too short
    if (trimmedQuery.length <= 2) {
        return (
            <div
                className={cn(
                    "flex flex-col items-center justify-center py-8 sm:py-12 text-sm text-muted-foreground",
                    className
                )}>
                <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-muted mb-2 sm:mb-3">
                    <Search className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <span className="font-medium text-sm sm:text-base">Start searching</span>
                <span className="text-xs mt-1 text-center px-4">Type at least 3 characters to see results</span>
            </div>
        );
    }

    if (variant === "modal") {
        return (
            <div className={className}>
                {isSearching && (
                    <>
                        {/* Loading indicator at the top */}
                        {(isFileSearching || isTraktSearching) && (
                            <div className="flex items-center justify-center py-2 text-xs text-muted-foreground border-b sticky top-0 bg-background z-10">
                                <Loader2 className="h-3 w-3 animate-spin mr-1.5" />
                                <span className="text-xs">Searching...</span>
                            </div>
                        )}

                        {/* File results section */}
                        {hasFileResults && (
                            <CommandGroup
                                heading="Your Files"
                                className="**:[[cmdk-group-heading]]:px-1 sm:**:[[cmdk-group-heading]]:px-3 **:[[cmdk-group-heading]]:py-1.5 sm:**:[[cmdk-group-heading]]:py-2 **:[[cmdk-group-heading]]:text-xs **:[[cmdk-group-heading]]:font-semibold **:[[cmdk-group-heading]]:text-muted-foreground">
                                {fileResults.map((file) => (
                                    <SearchFileItem key={file.id} file={file} onSelect={onFileSelect} variant="modal" />
                                ))}
                            </CommandGroup>
                        )}

                        {/* Trakt results section */}
                        {hasTraktResults && (
                            <CommandGroup
                                heading="Movies & TV Shows"
                                className="**:[[cmdk-group-heading]]:px-1 sm:**:[[cmdk-group-heading]]:px-3 **:[[cmdk-group-heading]]:py-1.5 sm:**:[[cmdk-group-heading]]:py-2 **:[[cmdk-group-heading]]:text-xs **:[[cmdk-group-heading]]:font-semibold **:[[cmdk-group-heading]]:text-muted-foreground">
                                {traktResults.map((result) => {
                                    const media = result.movie || result.show;
                                    const type = result.movie ? "movie" : "show";
                                    return (
                                        <SearchMediaItem
                                            key={`${type}-${media?.ids?.trakt}`}
                                            result={result}
                                            onSelect={onMediaSelect}
                                            variant="modal"
                                        />
                                    );
                                })}
                            </CommandGroup>
                        )}

                        {/* End of results */}
                        {bothLoaded && hasAnyResults && (
                            <div className="flex items-center justify-center py-6 text-xs text-muted-foreground border-t">
                                <span>
                                    End of results • {(fileResults?.length || 0) + (traktResults?.length || 0)} item
                                    {(fileResults?.length || 0) + (traktResults?.length || 0) !== 1 ? "s" : ""} found
                                </span>
                            </div>
                        )}

                        {/* No results */}
                        {bothLoaded && !hasAnyResults && (
                            <div className="flex flex-col items-center justify-center py-8 sm:py-12 text-sm text-muted-foreground">
                                <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-muted mb-2 sm:mb-3">
                                    <Search className="h-5 w-5 sm:h-6 sm:w-6" />
                                </div>
                                <span className="font-medium text-sm sm:text-base">No results found</span>
                                <span className="text-xs mt-1 text-center px-4">
                                    Try different keywords or check your spelling
                                </span>
                            </div>
                        )}
                    </>
                )}
            </div>
        );
    }

    // Page variant
    return (
        <div className={cn("space-y-6", className)}>
            {isSearching && (
                <>
                    {/* Loading indicator at the top */}
                    {(isFileSearching || isTraktSearching) && (
                        <div className="flex items-center justify-center py-2 text-xs text-muted-foreground sticky top-0 z-10">
                            <Loader2 className="h-3 w-3 animate-spin mr-1.5" />
                            <span className="text-xs">Searching...</span>
                        </div>
                    )}

                    {/* File results section */}
                    {hasFileResults && (
                        <section className="space-y-3">
                            <h2 className="text-sm font-semibold text-muted-foreground px-3">Your Files</h2>
                            <div className="space-y-1 border rounded-lg p-2">
                                {fileResults.map((file) => (
                                    <SearchFileItem key={file.id} file={file} onSelect={onFileSelect} variant="page" />
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Trakt results section */}
                    {hasTraktResults && (
                        <section className="space-y-3">
                            <h2 className="text-sm font-semibold text-muted-foreground px-3">Movies & TV Shows</h2>
                            <div className="space-y-1 border rounded-lg p-2">
                                {traktResults.map((result) => {
                                    const media = result.movie || result.show;
                                    const type = result.movie ? "movie" : "show";
                                    return (
                                        <SearchMediaItem
                                            key={`${type}-${media?.ids?.trakt}`}
                                            result={result}
                                            onSelect={onMediaSelect}
                                            variant="page"
                                        />
                                    );
                                })}
                            </div>
                        </section>
                    )}

                    {/* End of results */}
                    {bothLoaded && hasAnyResults && (
                        <div className="flex items-center justify-center py-6 text-sm text-muted-foreground border-t pt-6">
                            <span>
                                {(fileResults?.length || 0) + (traktResults?.length || 0)} item
                                {(fileResults?.length || 0) + (traktResults?.length || 0) !== 1 ? "s" : ""} found
                            </span>
                        </div>
                    )}

                    {/* No results */}
                    {bothLoaded && !hasAnyResults && (
                        <div className="flex flex-col items-center justify-center py-12 text-sm text-muted-foreground">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-3">
                                <Search className="h-6 w-6" />
                            </div>
                            <span className="font-medium text-base">No results found</span>
                            <span className="text-sm mt-1 text-center px-4">
                                Try different keywords or check your spelling
                            </span>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
