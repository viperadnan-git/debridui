"use client";

import { ArrowUpRight, Film, Star, Tv } from "lucide-react";
import { memo } from "react";
import { SearchItemWrapper } from "@/components/search-item-wrapper";
import type { TraktSearchResult } from "@/lib/trakt";
import { cn } from "@/lib/utils";
import { getPosterUrl } from "@/lib/utils/media";

interface SearchMediaItemProps {
    result: TraktSearchResult;
    onSelect: (result: TraktSearchResult) => void;
    variant?: "modal" | "page";
    className?: string;
}

export const SearchMediaItem = memo(function SearchMediaItem({
    result,
    onSelect,
    variant = "modal",
    className,
}: SearchMediaItemProps) {
    const media = result.movie || result.show;
    if (!media) return null;

    const type = result.movie ? "movie" : "show";
    const Icon = type === "movie" ? Film : Tv;
    const posterImage = getPosterUrl(media.images);
    const kicker = type === "movie" ? "Film" : "Series";

    return (
        <SearchItemWrapper
            data={result}
            variant={variant}
            onSelect={onSelect}
            commandValue={`${type}-${media.ids?.trakt}-${media.title}`}
            commandKeywords={[media.title, type, media.year?.toString() || ""]}
            className={className}>
            {/* Poster */}
            <div className="shrink-0 overflow-hidden rounded-sm bg-muted/50 ring-1 ring-border/30 w-16 h-24 sm:w-20 sm:h-28">
                {posterImage ? (
                    <img
                        src={posterImage}
                        alt={media.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        decoding="async"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <Icon className="size-4 text-muted-foreground" />
                    </div>
                )}
            </div>

            <div className="flex-1 min-w-0">
                {/* Title row */}
                <div className="flex items-baseline gap-2">
                    <h4 className="font-light truncate text-sm sm:text-base lg:text-lg">{media.title}</h4>
                    <ArrowUpRight className="hidden sm:block size-3.5 text-muted-foreground/40 -translate-x-1 opacity-0 group-hover/row:opacity-100 group-hover/row:translate-x-0 transition-all" />
                </div>

                {/* Metadata */}
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground mt-1">
                    <span
                        className={cn(
                            "text-[10px] tracking-[0.2em] uppercase",
                            type === "movie" ? "text-amber-400/90" : "text-sky-400/90"
                        )}>
                        {kicker}
                    </span>
                    {media.year && (
                        <>
                            <span className="text-border">·</span>
                            <span className="tabular-nums">{media.year}</span>
                        </>
                    )}
                    {!!media.rating && (
                        <>
                            <span className="text-border">·</span>
                            <span className="inline-flex items-center gap-1">
                                <Star className="size-3 fill-[#F5C518] text-[#F5C518] shrink-0 -translate-y-px" />
                                <span className="tabular-nums">{media.rating.toFixed(1)}</span>
                            </span>
                        </>
                    )}
                    {media.runtime && (
                        <>
                            <span className="text-border">·</span>
                            <span>{media.runtime}m</span>
                        </>
                    )}
                    {media.genres?.[0] && (
                        <>
                            <span className="text-border">·</span>
                            <span className="truncate">{media.genres.slice(0, 2).join(" / ")}</span>
                        </>
                    )}
                </div>

                {/* Overview */}
                {media.overview && (
                    <p className="text-xs text-muted-foreground/80 leading-relaxed mt-2 line-clamp-2 lg:line-clamp-3 max-w-2xl">
                        {media.overview}
                    </p>
                )}
            </div>
        </SearchItemWrapper>
    );
});
