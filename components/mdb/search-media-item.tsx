"use client";

import { useCallback, memo } from "react";
import { CommandItem } from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { Film, Tv, Star, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { type TraktSearchResult } from "@/lib/trakt";

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
    const handleSelect = useCallback(() => {
        onSelect(result);
    }, [result, onSelect]);

    const media = result.movie || result.show;
    if (!media) return null;

    const type = result.movie ? "movie" : "show";
    const Icon = type === "movie" ? Film : Tv;

    const images = media.images;
    const posterImage = images?.poster?.[0]
        ? `https://${images.poster[0]}`
        : images?.fanart?.[0]
          ? `https://${images.fanart[0]}`
          : images?.banner?.[0]
            ? `https://${images.banner[0]}`
            : null;

    const content = (
        <>
            {/* Poster thumbnail or icon */}
            <div className="shrink-0 w-10 h-14 sm:w-12 sm:h-16 bg-muted rounded-md overflow-hidden">
                {posterImage ? (
                    <img src={posterImage} alt={media.title} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                    </div>
                )}
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5">
                    <span className="font-medium truncate text-xs sm:text-sm">{media.title}</span>
                    <Badge
                        variant="secondary"
                        className={cn(
                            "text-xs px-1 sm:px-1.5 py-0 h-3.5 sm:h-4 shrink-0",
                            type === "movie" ? "bg-blue-500/10 text-blue-600" : "bg-purple-500/10 text-purple-600"
                        )}>
                        {type === "movie" ? "Movie" : "Show"}
                    </Badge>
                </div>

                <div className="flex items-center gap-1.5 sm:gap-2 text-xs text-muted-foreground">
                    {media.year && (
                        <div className="flex items-center gap-0.5 sm:gap-1">
                            <Calendar className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                            <span>{media.year}</span>
                        </div>
                    )}
                    {media.rating && (
                        <>
                            {media.year && <span>•</span>}
                            <div className="flex items-center gap-0.5 sm:gap-1">
                                <Star className="h-2.5 w-2.5 sm:h-3 sm:w-3 fill-yellow-400 text-yellow-400" />
                                <span>{media.rating.toFixed(1)}</span>
                            </div>
                        </>
                    )}
                </div>

                {media.overview && (
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mt-1">{media.overview}</p>
                )}
            </div>
        </>
    );

    if (variant === "modal") {
        return (
            <CommandItem
                key={`${type}-${media.ids?.trakt}`}
                value={`${type}-${media.ids?.trakt}-${media.title}`}
                keywords={[media.title, type, media.year?.toString() || ""]}
                onSelect={handleSelect}
                className={cn("flex items-center gap-2 sm:gap-3 px-1 sm:px-3 py-2 sm:py-3 cursor-pointer", className)}>
                {content}
            </CommandItem>
        );
    }

    return (
        <div
            onClick={handleSelect}
            className={cn(
                "flex items-center gap-2 sm:gap-3 px-3 py-3 cursor-pointer rounded-md hover:bg-muted transition-colors",
                className
            )}>
            {content}
        </div>
    );
});
