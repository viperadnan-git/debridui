"use client";

import { type TraktSeason } from "@/lib/trakt";
import { Star } from "lucide-react";
import { cn, formatYear } from "@/lib/utils";
import { memo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { traktClient } from "@/lib/trakt";
import { getPosterUrl } from "@/lib/utils/trakt";

interface SeasonCardProps {
    season: TraktSeason;
    isSelected?: boolean;
    onClick?: () => void;
    className?: string;
    mediaId?: string;
}

export const SeasonCard = memo(function SeasonCard({
    season,
    isSelected,
    onClick,
    className,
    mediaId,
}: SeasonCardProps) {
    const queryClient = useQueryClient();

    const seasonName = season.number === 0 ? "Specials" : `Season ${season.number}`;
    const seasonLabel = season.number === 0 ? "SP" : String(season.number).padStart(2, "0");
    const posterUrl =
        getPosterUrl(season.images) ||
        `https://placehold.co/200x300/1a1a1a/3e3e3e?text=${encodeURIComponent(seasonLabel)}`;

    // Prefetch season episodes on hover
    const prefetchSeason = () => {
        if (!mediaId) return;

        queryClient.prefetchQuery({
            queryKey: ["trakt", "season", "episodes", mediaId, season.number],
            queryFn: () => traktClient.getShowEpisodes(mediaId, season.number),
        });
    };

    return (
        <div
            className={cn("group cursor-pointer w-28 sm:w-32 md:w-36 pt-1", className)}
            onClick={onClick}
            onMouseEnter={prefetchSeason}>
            <div
                className={cn(
                    "aspect-2/3 relative overflow-hidden bg-muted/30 rounded-sm transition-all duration-300",
                    isSelected
                        ? "ring-2 ring-primary ring-offset-1 ring-offset-background"
                        : "hover:ring-1 hover:ring-border"
                )}>
                <img
                    src={posterUrl}
                    alt={seasonName}
                    className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-hover"
                    loading="lazy"
                />

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                {/* Season number - editorial style */}
                <div className="absolute top-2.5 left-2.5">
                    <span
                        className={cn(
                            "text-xs font-medium tracking-wider px-2 py-1 rounded-sm backdrop-blur-sm",
                            isSelected ? "bg-primary text-primary-foreground" : "bg-black/60 text-white/90"
                        )}>
                        {seasonLabel}
                    </span>
                </div>

                {/* Rating - minimal style */}
                {season.rating && (
                    <div className="absolute top-2.5 right-2.5">
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-white/90 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-sm">
                            <Star className="size-3 fill-[#F5C518] text-[#F5C518]" />
                            {season.rating.toFixed(1)}
                        </span>
                    </div>
                )}

                {/* Bottom info - always visible */}
                <div className="absolute bottom-0 left-0 right-0 p-3">
                    <div className="space-y-1">
                        {!!season.episode_count && (
                            <p className="text-xs text-white/90 font-medium">{season.episode_count} Episodes</p>
                        )}
                        {season.first_aired && (
                            <p className="text-xs text-white/60">{formatYear(season.first_aired)}</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
});
