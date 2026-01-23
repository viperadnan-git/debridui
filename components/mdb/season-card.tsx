"use client";

import { type TraktSeason } from "@/lib/trakt";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Star } from "lucide-react";
import { cn } from "@/lib/utils";
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

    const seasonName = season.number === 0 ? "Specials" : `${season.number}`;
    const posterUrl =
        getPosterUrl(season.images) ||
        `https://placehold.co/200x300/1a1a1a/white?text=${encodeURIComponent(seasonName)}`;

    // Prefetch season episodes on hover to eliminate 200-500ms waterfall
    const prefetchSeason = () => {
        if (!mediaId) return;

        queryClient.prefetchQuery({
            queryKey: ["trakt", "season", "episodes", mediaId, season.number],
            queryFn: () => traktClient.getShowEpisodes(mediaId, season.number),
        });
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return null;
        return new Date(dateString).getFullYear();
    };

    return (
        <div
            className={cn("group cursor-pointer transition-all hover:scale-105 w-32 sm:w-36 md:w-40", className)}
            onClick={onClick}
            onMouseEnter={prefetchSeason}>
            <div
                className={cn(
                    "aspect-2/3 relative overflow-hidden bg-muted rounded-lg shadow-md transition-all",
                    isSelected ? "ring-2 ring-primary shadow-lg" : "hover:shadow-lg"
                )}>
                {}
                <img
                    src={posterUrl}
                    alt={`Season ${season.number}`}
                    className="object-cover w-full h-full"
                    loading="lazy"
                />

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                {/* Season number badge */}
                <div className="absolute top-2 left-2">
                    <Badge
                        variant={isSelected ? "default" : "outline"}
                        className={cn(
                            "text-xs font-bold shadow-sm",
                            !isSelected && "bg-black/50 border-white/20 text-white"
                        )}>
                        {seasonName}
                    </Badge>
                </div>

                {/* Rating badge - always visible */}
                {season.rating && (
                    <div className="absolute top-2 right-2">
                        <Badge variant="outline" className="text-xs bg-black/50 border-white/20 text-white">
                            <Star className="h-3 w-3 fill-yellow-500 text-yellow-500 mr-1" />
                            {season.rating.toFixed(1)}
                        </Badge>
                    </div>
                )}

                {/* Hover details */}
                <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="space-y-1">
                        {season.episode_count && (
                            <p className="text-white text-xs font-medium">{season.episode_count} Episodes</p>
                        )}

                        <div className="flex items-center gap-3 text-white/80 text-xs">
                            {season.first_aired && (
                                <div className="flex items-center gap-1">
                                    <CalendarDays className="h-3 w-3" />
                                    {formatDate(season.first_aired)}
                                </div>
                            )}

                            {season.votes && (
                                <div className="flex items-center gap-1">
                                    <span>{season.votes.toLocaleString()} votes</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
});
