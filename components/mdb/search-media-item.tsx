"use client";

import { memo } from "react";
import { Film, Tv, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { type TraktSearchResult } from "@/lib/trakt";
import { getPosterUrl } from "@/lib/utils/media";
import { SearchItemWrapper } from "@/components/search-item-wrapper";

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

    return (
        <SearchItemWrapper
            data={result}
            variant={variant}
            onSelect={onSelect}
            commandValue={`${type}-${media.ids?.trakt}-${media.title}`}
            commandKeywords={[media.title, type, media.year?.toString() || ""]}
            className={className}>
            {/* Poster thumbnail or icon */}
            <div className="shrink-0 w-10 h-14 sm:w-11 sm:h-16 bg-muted/50 rounded-sm overflow-hidden">
                {posterImage ? (
                    <img src={posterImage} alt={media.title} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <Icon className="size-4 text-muted-foreground" />
                    </div>
                )}
            </div>

            <div className="flex-1 min-w-0">
                {/* Title and type indicator */}
                <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-medium truncate text-sm">{media.title}</span>
                    <span
                        className={cn(
                            "text-xs tracking-wide uppercase shrink-0",
                            type === "movie" ? "text-blue-500" : "text-purple-500"
                        )}>
                        {type === "movie" ? "Film" : "Series"}
                    </span>
                </div>

                {/* Metadata with editorial separators */}
                <div className="flex items-center text-xs text-muted-foreground">
                    {media.year && <span>{media.year}</span>}
                    {media.rating && (
                        <>
                            {media.year && <span className="text-border mx-1.5">·</span>}
                            <span className="flex items-center gap-1">
                                <Star className="size-2.5 fill-yellow-400 text-yellow-400" />
                                {media.rating.toFixed(1)}
                            </span>
                        </>
                    )}
                </div>

                {/* Overview */}
                {media.overview && (
                    <p className="text-xs text-muted-foreground/80 line-clamp-2 leading-relaxed mt-1.5">
                        {media.overview}
                    </p>
                )}
            </div>
        </SearchItemWrapper>
    );
});
