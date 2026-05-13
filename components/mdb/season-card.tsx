"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Star } from "lucide-react";
import { memo } from "react";
import { type TraktSeason, traktClient } from "@/lib/trakt";
import { cn, formatYear } from "@/lib/utils";
import { getPosterUrl } from "@/lib/utils/media";

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

    const isSpecials = season.number === 0;
    const seasonName = isSpecials ? "Specials" : `Season ${season.number}`;
    const seasonLabel = isSpecials ? "SP" : String(season.number).padStart(2, "0");
    const kicker = isSpecials ? "Specials" : "Season";
    const posterUrl =
        getPosterUrl(season.images) ||
        `https://placehold.co/200x300/1a1a1a/3e3e3e?text=${encodeURIComponent(seasonLabel)}`;

    const prefetchSeason = () => {
        if (!mediaId) return;
        queryClient.prefetchQuery({
            queryKey: ["trakt", "season", "episodes", mediaId, season.number],
            queryFn: () => traktClient.getShowEpisodes(mediaId, season.number),
        });
    };

    return (
        // biome-ignore lint/a11y/noStaticElementInteractions: card-level click navigates; keyboard users use parent list
        <div
            className={cn("group cursor-pointer w-28 sm:w-32 md:w-36", className)}
            onClick={onClick}
            onMouseEnter={prefetchSeason}>
            <div
                className={cn(
                    "aspect-2/3 relative overflow-hidden bg-muted/30 rounded-sm transition-all duration-300",
                    "after:absolute after:inset-0 after:rounded-sm after:pointer-events-none after:transition-colors",
                    isSelected
                        ? "after:border-2 after:border-primary shadow-lg shadow-primary/20"
                        : "after:border after:border-border/40 group-hover:after:border-border"
                )}>
                <img
                    src={posterUrl}
                    alt={seasonName}
                    className="object-cover w-full h-full transition-transform duration-500 ease-out group-hover:scale-105"
                    loading="lazy"
                />

                {/* Bottom gradient — keeps editorial caption legible */}
                <div className="absolute inset-x-0 bottom-0 h-3/4 bg-linear-to-t from-black via-black/80 to-transparent pointer-events-none" />

                {/* Editorial caption */}
                <div className="absolute inset-x-0 bottom-0 p-2 sm:p-2.5 md:p-3 space-y-1 sm:space-y-1.5 [text-shadow:0_1px_2px_rgb(0_0_0/0.6)]">
                    {/* Track number + hairline rule (filmstrip frame ID) */}
                    <div className="flex items-baseline gap-1.5 sm:gap-2">
                        <span
                            className={cn(
                                "text-base sm:text-lg md:text-xl font-light leading-none tabular-nums transition-colors",
                                isSelected ? "text-primary" : "text-white"
                            )}>
                            {seasonLabel}
                        </span>
                        <span
                            className={cn(
                                "flex-1 h-px transition-colors",
                                isSelected ? "bg-primary/60" : "bg-white/25 group-hover:bg-white/40"
                            )}
                        />
                    </div>

                    {/* Kicker */}
                    <div className="flex items-center gap-1 sm:gap-1.5 text-[9px] sm:text-[10px] tracking-[0.2em] sm:tracking-[0.25em] uppercase text-white/90">
                        <span>{kicker}</span>
                        {season.first_aired && (
                            <>
                                <span className="text-white/30">·</span>
                                <span className="tabular-nums">{formatYear(season.first_aired)}</span>
                            </>
                        )}
                    </div>

                    {/* Meta row */}
                    {(!!season.episode_count || !!season.rating) && (
                        <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-[11px] text-white">
                            {!!season.episode_count && (
                                <span className="tabular-nums">
                                    {season.episode_count}
                                    <span className="text-white/55"> ep</span>
                                </span>
                            )}
                            {!!season.episode_count && !!season.rating && <span className="text-white/30">·</span>}
                            {!!season.rating && (
                                <span className="inline-flex items-center gap-1">
                                    <Star className="size-3 fill-[#F5C518] text-[#F5C518] -translate-y-px" />
                                    <span className="tabular-nums">{season.rating.toFixed(1)}</span>
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
});
