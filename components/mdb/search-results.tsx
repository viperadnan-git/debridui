"use client";

import { Clapperboard, FolderClosed, Loader2, type LucideIcon, Magnet, Search } from "lucide-react";
import type { TorBoxSearchResult } from "@/lib/clients/torbox";
import type { TraktSearchResult } from "@/lib/trakt";
import type { DebridFile } from "@/lib/types";
import { cn } from "@/lib/utils";
import { SearchFileItem } from "./search-file-item";
import { SearchHistorySection } from "./search-history-section";
import { SearchMediaItem } from "./search-media-item";
import { SearchSourceItem } from "./search-source-item";

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
    onHistoryItemClick?: () => void;
    variant?: "modal" | "page";
    className?: string;
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

function PageSectionHeader({
    icon: Icon,
    label,
    count,
    loading,
    className,
}: {
    icon: LucideIcon;
    label: string;
    count?: number;
    loading?: boolean;
    className?: string;
}) {
    return (
        <div className={cn("flex items-center gap-2", className)}>
            <Icon className="size-3.5 text-muted-foreground/70 shrink-0" />
            <h3 className="text-[10px] sm:text-xs tracking-[0.25em] uppercase text-muted-foreground">{label}</h3>
            {loading ? (
                <Loader2 className="size-3 text-muted-foreground/60 animate-spin" />
            ) : count !== undefined ? (
                <span className="text-[10px] sm:text-xs text-muted-foreground/60 tabular-nums">
                    · {String(count).padStart(2, "0")}
                </span>
            ) : null}
        </div>
    );
}

function SectionSkeleton({ rows = 3 }: { rows?: number }) {
    return (
        <div className="divide-y divide-border/30">
            {Array.from({ length: rows }, (_, i) => `skeleton-${i}`).map((id) => (
                <div key={id} className="flex items-start gap-3 sm:gap-4 px-4 lg:px-5 py-3.5 lg:py-4">
                    <div className="w-16 h-24 sm:w-20 sm:h-28 shrink-0 bg-muted/40 rounded-sm animate-pulse" />
                    <div className="flex-1 min-w-0 space-y-2 pt-1">
                        <div className="h-4 sm:h-5 bg-muted/40 rounded-sm w-3/4 animate-pulse" />
                        <div className="h-3 bg-muted/30 rounded-sm w-1/3 animate-pulse" />
                        <div className="h-3 bg-muted/30 rounded-sm w-full animate-pulse" />
                        <div className="h-3 bg-muted/30 rounded-sm w-2/3 animate-pulse" />
                    </div>
                </div>
            ))}
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
    onHistoryItemClick,
    variant = "modal",
    className,
}: SearchResultsProps) {
    const trimmedQuery = query.trim();
    const hasFileResults = !!fileResults?.length;
    const hasTraktResults = !!traktResults?.length;
    const hasSourceResults = !!sourceResults?.length;
    const isSearching = trimmedQuery.length > 2;
    const bothLoaded = !isFileSearching && !isTraktSearching && !isSourceSearching;
    const hasAnyResults = hasFileResults || hasTraktResults || hasSourceResults;

    if (trimmedQuery.length <= 2) {
        return (
            <div className={cn(variant === "modal" ? "py-4 space-y-6" : "space-y-8", className)}>
                <SearchHistorySection variant={variant} onItemClick={onHistoryItemClick} />
                <EmptyState
                    title="Start searching"
                    subtitle={
                        trimmedQuery.length > 0
                            ? "Type at least 3 characters"
                            : "Type to discover movies, TV shows, and your files"
                    }
                />
            </div>
        );
    }

    if (!isSearching) return null;

    const isModal = variant === "modal";
    const listClass = isModal
        ? "divide-y divide-border/30"
        : "-mx-4 lg:mx-0 divide-y divide-border/30 lg:border lg:border-border/40 lg:rounded-sm lg:overflow-hidden";
    const sectionsWrap = cn(isModal ? "py-4 space-y-8" : "space-y-10 sm:space-y-12", className);
    // In modal there's no outer page padding — align header with the row's image position (row uses px-4 lg:px-5)
    const headerPadding = isModal ? "px-4 lg:px-5" : undefined;
    const totalCount = (fileResults?.length || 0) + (traktResults?.length || 0) + (sourceResults?.length || 0);

    return (
        <div className={sectionsWrap}>
            {/* Your Files */}
            {hasFileResults && (
                <section className="space-y-4 sm:space-y-5">
                    <PageSectionHeader
                        icon={FolderClosed}
                        label="Your Files"
                        count={fileResults.length}
                        className={headerPadding}
                    />
                    <div className={listClass}>
                        {fileResults.map((file) => (
                            <SearchFileItem key={file.id} file={file} onSelect={onFileSelect} variant={variant} />
                        ))}
                    </div>
                </section>
            )}

            {/* Movies & Shows */}
            {(hasTraktResults || (isTraktSearching && !hasAnyResults)) && (
                <section className="space-y-4 sm:space-y-5">
                    <PageSectionHeader
                        icon={Clapperboard}
                        label="Movies & Shows"
                        count={hasTraktResults ? traktResults.length : undefined}
                        loading={isTraktSearching && !hasTraktResults}
                        className={headerPadding}
                    />
                    {hasTraktResults ? (
                        <div className={listClass}>
                            {traktResults.map((result) => {
                                const media = result.movie || result.show;
                                const type = result.movie ? "movie" : "show";
                                return (
                                    <SearchMediaItem
                                        key={`${type}-${media?.ids?.trakt}`}
                                        result={result}
                                        onSelect={onMediaSelect}
                                        variant={variant}
                                    />
                                );
                            })}
                        </div>
                    ) : (
                        <div className={isModal ? "" : "-mx-4 lg:mx-0"}>
                            <SectionSkeleton rows={3} />
                        </div>
                    )}
                </section>
            )}

            {/* Sources */}
            {hasSourceResults && (
                <section className="space-y-4 sm:space-y-5">
                    <PageSectionHeader
                        icon={Magnet}
                        label="Sources"
                        count={sourceResults.length}
                        className={headerPadding}
                    />
                    <div className={listClass}>
                        {sourceResults.map((result) => (
                            <SearchSourceItem key={result.hash} result={result} variant={variant} />
                        ))}
                    </div>
                </section>
            )}

            {/* Summary footer */}
            {bothLoaded && hasAnyResults && (
                <div className="flex items-center justify-center gap-3 pt-2">
                    <span className="h-px w-12 bg-border/40" />
                    <span className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground tabular-nums">
                        End · {String(totalCount).padStart(2, "0")} results
                    </span>
                    <span className="h-px w-12 bg-border/40" />
                </div>
            )}

            {bothLoaded && !hasAnyResults && (
                <EmptyState title="No results found" subtitle="Try different keywords or check your spelling" />
            )}
        </div>
    );
}
