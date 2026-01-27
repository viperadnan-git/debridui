"use client";

import { CommandGroup } from "@/components/ui/command";
import { Search, Loader2 } from "lucide-react";
import { type DebridFile } from "@/lib/types";
import { type TorBoxSearchResult } from "@/lib/clients/torbox";
import { type TraktSearchResult } from "@/lib/trakt";
import { SearchFileItem } from "./search-file-item";
import { SearchMediaItem } from "./search-media-item";
import { SearchSourceItem } from "./search-source-item";
import { cn } from "@/lib/utils";

interface SearchResultsProps {
    query: string;
    fileResults?: DebridFile[];
    traktResults?: TraktSearchResult[];
    sourceResults?: TorBoxSearchResult[];
    isFileSearching: boolean;
    isTraktSearching: boolean;
    isSourceSearching: boolean;
    onFileSelect: (file: DebridFile) => void;
    onMediaSelect: (result: TraktSearchResult) => void;
    variant?: "modal" | "page";
    className?: string;
}

function SectionDivider({ label }: { label: string }) {
    return (
        <div className="flex items-center gap-4 py-2">
            <div className="h-px flex-1 bg-border/50" />
            <span className="text-xs tracking-widest uppercase text-muted-foreground">{label}</span>
            <div className="h-px flex-1 bg-border/50" />
        </div>
    );
}

function EmptyState({ title, subtitle }: { title: string; subtitle: string }) {
    return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
            <Search className="size-8 text-muted-foreground/40 mb-4" />
            <span className="text-sm font-light text-foreground">{title}</span>
            <span className="text-xs text-muted-foreground mt-1">{subtitle}</span>
        </div>
    );
}

function LoadingIndicator() {
    return (
        <div className="flex items-center justify-center gap-2 py-3 text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            <span className="text-xs tracking-wide">Searching...</span>
        </div>
    );
}

export function SearchResults({
    query,
    fileResults,
    traktResults,
    sourceResults,
    isFileSearching,
    isTraktSearching,
    isSourceSearching,
    onFileSelect,
    onMediaSelect,
    variant = "modal",
    className,
}: SearchResultsProps) {
    const trimmedQuery = query.trim();
    const hasFileResults = fileResults && fileResults.length > 0;
    const hasTraktResults = traktResults && traktResults.length > 0;
    const hasSourceResults = sourceResults && sourceResults.length > 0;
    const isSearching = trimmedQuery.length > 2;
    const bothLoaded = !isFileSearching && !isTraktSearching && !isSourceSearching;
    const hasAnyResults = hasFileResults || hasTraktResults || hasSourceResults;

    // Show initial state when query is too short
    if (trimmedQuery.length <= 2) {
        return (
            <div className={cn("", className)}>
                <EmptyState title="Start searching" subtitle="Type at least 3 characters to see results" />
            </div>
        );
    }

    if (variant === "modal") {
        return (
            <div className={className}>
                {isSearching && (
                    <>
                        {/* Loading indicator at the top */}
                        {(isFileSearching || isTraktSearching || isSourceSearching) && (
                            <div className="flex items-center justify-center py-2 text-xs text-muted-foreground border-b border-border/50 sticky top-0 bg-background z-10">
                                <Loader2 className="size-4 animate-spin mr-1.5" />
                                <span className="text-xs tracking-wide">Searching...</span>
                            </div>
                        )}

                        {/* File results section */}
                        {hasFileResults && (
                            <CommandGroup
                                heading="Your Files"
                                className="**:[[cmdk-group-heading]]:px-3 **:[[cmdk-group-heading]]:py-2 **:[[cmdk-group-heading]]:text-xs **:[[cmdk-group-heading]]:tracking-wider **:[[cmdk-group-heading]]:uppercase **:[[cmdk-group-heading]]:text-muted-foreground **:[[cmdk-group-heading]]:font-normal">
                                {fileResults.map((file) => (
                                    <SearchFileItem key={file.id} file={file} onSelect={onFileSelect} variant="modal" />
                                ))}
                            </CommandGroup>
                        )}

                        {/* Trakt results section */}
                        {hasTraktResults && (
                            <CommandGroup
                                heading="Movies & Shows"
                                className="**:[[cmdk-group-heading]]:px-3 **:[[cmdk-group-heading]]:py-2 **:[[cmdk-group-heading]]:text-xs **:[[cmdk-group-heading]]:tracking-wider **:[[cmdk-group-heading]]:uppercase **:[[cmdk-group-heading]]:text-muted-foreground **:[[cmdk-group-heading]]:font-normal">
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

                        {/* Source results */}
                        {hasSourceResults && (
                            <CommandGroup
                                heading="Sources"
                                className="**:[[cmdk-group-heading]]:px-3 **:[[cmdk-group-heading]]:py-2 **:[[cmdk-group-heading]]:text-xs **:[[cmdk-group-heading]]:tracking-wider **:[[cmdk-group-heading]]:uppercase **:[[cmdk-group-heading]]:text-muted-foreground **:[[cmdk-group-heading]]:font-normal">
                                {sourceResults.map((result) => (
                                    <SearchSourceItem key={result.hash} result={result} variant="modal" />
                                ))}
                            </CommandGroup>
                        )}

                        {/* End of results */}
                        {bothLoaded && hasAnyResults && (
                            <div className="flex items-center justify-center py-4 text-xs text-muted-foreground border-t border-border/50">
                                <span>
                                    {(() => {
                                        const totalCount =
                                            (fileResults?.length || 0) +
                                            (traktResults?.length || 0) +
                                            (sourceResults?.length || 0);
                                        return `${totalCount} result${totalCount !== 1 ? "s" : ""}`;
                                    })()}
                                </span>
                            </div>
                        )}

                        {/* No results */}
                        {bothLoaded && !hasAnyResults && (
                            <EmptyState title="No results found" subtitle="Try different keywords" />
                        )}
                    </>
                )}
            </div>
        );
    }

    // Page variant
    return (
        <div className={cn("space-y-8", className)}>
            {isSearching && (
                <>
                    {/* Loading indicator */}
                    {(isFileSearching || isTraktSearching || isSourceSearching) && <LoadingIndicator />}

                    {/* File results section */}
                    {hasFileResults && (
                        <section className="space-y-4">
                            <SectionDivider label="Your Files" />
                            <div className="border border-border/50 rounded-sm overflow-hidden">
                                {fileResults.map((file) => (
                                    <SearchFileItem key={file.id} file={file} onSelect={onFileSelect} variant="page" />
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Trakt results section */}
                    {hasTraktResults && (
                        <section className="space-y-4">
                            <SectionDivider label="Movies & Shows" />
                            <div className="border border-border/50 rounded-sm overflow-hidden">
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

                    {/* Source results */}
                    {hasSourceResults && (
                        <section className="space-y-4">
                            <SectionDivider label="Sources" />
                            <div className="border border-border/50 rounded-sm overflow-hidden">
                                {sourceResults.map((result) => (
                                    <SearchSourceItem key={result.hash} result={result} variant="page" />
                                ))}
                            </div>
                        </section>
                    )}

                    {/* End of results */}
                    {bothLoaded && hasAnyResults && (
                        <div className="flex items-center justify-center py-6 text-xs text-muted-foreground">
                            <span>
                                {(() => {
                                    const totalCount =
                                        (fileResults?.length || 0) +
                                        (traktResults?.length || 0) +
                                        (sourceResults?.length || 0);
                                    return `${totalCount} result${totalCount !== 1 ? "s" : ""}`;
                                })()}
                            </span>
                        </div>
                    )}

                    {/* No results */}
                    {bothLoaded && !hasAnyResults && (
                        <EmptyState title="No results found" subtitle="Try different keywords or check your spelling" />
                    )}
                </>
            )}
        </div>
    );
}
