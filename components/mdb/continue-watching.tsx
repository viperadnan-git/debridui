"use client";

import { memo, useMemo, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { Play, SkipForward, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ScrollCarousel } from "@/components/common/scroll-carousel";
import { useStreamingStore, type StreamingRequest } from "@/lib/stores/streaming";
import { useUserAddons } from "@/hooks/use-addons";
import {
    usePlaybackHistory,
    useRemoveFromPlaybackHistory,
    useClearPlaybackHistory,
} from "@/hooks/use-playback-history";
import { traktClient } from "@/lib/trakt";
import type { PlaybackHistory } from "@/lib/db/schema";
import type { Addon } from "@/lib/addons/types";
import type { TvSearchParams } from "@/lib/addons/types";

function formatEpisodeLabel(season: number, episode: number): string {
    return `S${String(season).padStart(2, "0")}E${String(episode).padStart(2, "0")}`;
}

function isRequestMatch(
    activeRequest: StreamingRequest | null,
    entry: Pick<StreamingRequest, "imdbId" | "type" | "tvParams">
): boolean {
    if (!activeRequest) return false;
    return (
        activeRequest.imdbId === entry.imdbId &&
        activeRequest.type === entry.type &&
        activeRequest.tvParams?.season === entry.tvParams?.season &&
        activeRequest.tvParams?.episode === entry.tvParams?.episode
    );
}

function useNextEpisode(
    imdbId: string,
    type: "movie" | "show",
    season: number | null,
    episode: number | null
): TvSearchParams | null {
    const { data: seasons } = useQuery({
        queryKey: ["trakt", "show", "seasons", imdbId],
        queryFn: () => traktClient.getShowSeasons(imdbId),
        staleTime: 24 * 60 * 60 * 1000,
        enabled: type === "show" && !!season && !!episode,
    });

    return useMemo(() => {
        if (!seasons || !season || !episode) return null;

        const regularSeasons = seasons.filter((s) => s.number > 0).sort((a, b) => a.number - b.number);
        const current = regularSeasons.find((s) => s.number === season);
        if (!current) return null;

        if (episode < (current.aired_episodes ?? 0)) {
            return { season, episode: episode + 1 };
        }

        const next = regularSeasons.find((s) => s.number > season && (s.aired_episodes ?? 0) > 0);
        if (next) return { season: next.number, episode: 1 };

        return null;
    }, [seasons, season, episode]);
}

interface ContinueWatchingCardProps {
    entry: {
        id: string;
        imdbId: string;
        type: "movie" | "show";
        title: string;
        year: number | null;
        posterUrl: string | null;
        season: number | null;
        episode: number | null;
    };
    isLoading: boolean;
    onPlay: () => void;
    onPlayNext?: () => void;
    onRemove: () => void;
}

const ContinueWatchingCard = memo(function ContinueWatchingCard({
    entry,
    isLoading,
    onPlay,
    onPlayNext,
    onRemove,
}: ContinueWatchingCardProps) {
    const episodeLabel =
        entry.type === "show" && entry.season && entry.episode ? formatEpisodeLabel(entry.season, entry.episode) : null;

    const linkHref =
        entry.type === "show" && entry.season
            ? `/${entry.type}s/${entry.imdbId}?season=${entry.season}#seasons`
            : `/${entry.type}s/${entry.imdbId}`;
    const placeholderUrl = `https://placehold.co/300x450/0f0f0f/1f1f1f?text=${encodeURIComponent(entry.title)}`;
    const posterUrl = entry.posterUrl || placeholderUrl;

    return (
        <article className="group relative aspect-[2/3] overflow-hidden rounded-sm bg-black/20 border border-border/40 transition-transform duration-300 ease-out hover:scale-hover">
            {/* Remove button — fades in on hover */}
            <button
                type="button"
                onClick={onRemove}
                className="absolute -top-px -right-px z-20 size-7 flex items-center justify-center rounded-bl-sm bg-black/50 text-white/70 opacity-40 cursor-pointer lg:opacity-0 lg:group-hover:opacity-100 hover:bg-destructive hover:text-white transition-all duration-200 backdrop-blur-sm"
                aria-label={`Remove ${entry.title} from continue watching`}>
                <X className="size-3 -translate-x-px translate-y-px" strokeWidth={2.5} />
            </button>

            {/* Clickable Image Area */}
            <Link href={linkHref} className="absolute inset-0 z-0">
                {/* Poster Image */}
                <Image
                    src={posterUrl}
                    alt={entry.title}
                    fill
                    sizes="(max-width: 640px) 160px, (max-width: 768px) 180px, 200px"
                    className="object-cover transition-opacity duration-300"
                    loading="lazy"
                    unoptimized
                />

                {/* Gradient Overlay - Base */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent" />

                {/* Hover overlay - Enhanced gradient on hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </Link>

            {/* Title & Metadata - Above buttons */}
            <div className="absolute inset-x-2.5 bottom-[52px] z-10 space-y-1">
                <Link href={linkHref}>
                    <h3 className="font-light text-sm leading-snug text-white line-clamp-2 hover:text-white/80 transition-colors">
                        {entry.title}
                    </h3>
                </Link>
                <div className="flex items-center gap-1.5 text-xs text-white/50">
                    {entry.year && <span>{entry.year}</span>}
                    {episodeLabel && (
                        <div className="flex flex-row ml-auto">
                            <span className="text-white/20">·</span>
                            <span className="font-medium text-primary">{episodeLabel}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Action Buttons - Bottom */}
            <div className="absolute inset-x-2.5 bottom-2.5 z-10 flex gap-1.5">
                {/* Primary Play Button */}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            size="sm"
                            disabled={isLoading}
                            onClick={onPlay}
                            className="flex-1 rounded-sm bg-primary/10 hover:bg-primary/20 border border-primary/30 hover:border-primary/50 text-primary transition-colors backdrop-blur-sm"
                            aria-label={`Play ${entry.title}${episodeLabel ? ` ${episodeLabel}` : ""}`}>
                            <Play className="size-4 fill-current" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p className="text-xs">{episodeLabel ? `Play ${episodeLabel}` : "Play"}</p>
                    </TooltipContent>
                </Tooltip>

                {/* Next Episode Icon Button - Shows only */}
                {entry.type === "show" && entry.season && entry.episode && onPlayNext && (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                size="sm"
                                variant="ghost"
                                disabled={isLoading}
                                onClick={onPlayNext}
                                className="size-8 shrink-0 rounded-sm bg-black/40 hover:bg-black/60 border border-white/10 hover:border-white/20 text-white transition-colors backdrop-blur-sm p-0"
                                aria-label={`Play next episode`}>
                                <SkipForward className="size-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p className="text-xs">Next Episode</p>
                        </TooltipContent>
                    </Tooltip>
                )}
            </div>
        </article>
    );
});

interface ContinueWatchingEntryProps {
    entry: PlaybackHistory;
    play: (request: StreamingRequest, addons: Addon[]) => void;
    addons: Addon[];
    activeRequest: StreamingRequest | null;
    isAddonsLoading: boolean;
    onRemove: (imdbId: string) => void;
}

const ContinueWatchingEntry = memo(function ContinueWatchingEntry({
    entry,
    play,
    addons,
    activeRequest,
    isAddonsLoading,
    onRemove,
}: ContinueWatchingEntryProps) {
    const tvParams = useMemo(
        () => (entry.season && entry.episode ? { season: entry.season, episode: entry.episode } : undefined),
        [entry.season, entry.episode]
    );

    const nextEpisode = useNextEpisode(entry.imdbId, entry.type, entry.season, entry.episode);
    const isLoading = isAddonsLoading || isRequestMatch(activeRequest, { ...entry, tvParams });

    const playRequest = useMemo<StreamingRequest>(
        () => ({
            imdbId: entry.imdbId,
            type: entry.type,
            tvParams,
            media: {
                title: entry.title,
                year: entry.year || undefined,
                ids: { imdb: entry.imdbId },
                images: entry.posterUrl ? { poster: [entry.posterUrl] } : undefined,
            },
        }),
        [entry.imdbId, entry.type, entry.title, entry.year, entry.posterUrl, tvParams]
    );

    const handlePlay = useCallback(() => play(playRequest, addons), [play, playRequest, addons]);

    const handlePlayNext = useCallback(() => {
        if (!nextEpisode) return;
        play({ ...playRequest, tvParams: nextEpisode }, addons);
    }, [play, playRequest, nextEpisode, addons]);

    const handleRemove = useCallback(() => onRemove(entry.imdbId), [onRemove, entry.imdbId]);

    return (
        <ContinueWatchingCard
            entry={entry}
            isLoading={isLoading}
            onPlay={handlePlay}
            onPlayNext={nextEpisode ? handlePlayNext : undefined}
            onRemove={handleRemove}
        />
    );
});

export const ContinueWatching = memo(function ContinueWatching() {
    const { data: entries = [], isPending: isHistoryLoading } = usePlaybackHistory();
    const activeRequest = useStreamingStore((s) => s.activeRequest);
    const play = useStreamingStore((s) => s.play);
    const { data: addons = [], isPending: isAddonsLoading } = useUserAddons();
    const { mutate: removeEntry } = useRemoveFromPlaybackHistory();
    const { mutate: clearAll } = useClearPlaybackHistory();
    const handleRemove = useCallback((imdbId: string) => removeEntry({ imdbId }), [removeEntry]);

    if (isHistoryLoading || entries.length === 0) return null;

    return (
        <section className="group/section mt-16 space-y-4 lg:space-y-6 lg:px-6">
            {/* Section Header - Editorial Style */}
            <div className="flex items-center gap-4">
                <div className="h-px w-8 bg-primary" />
                <h2 className="text-xs tracking-widest uppercase text-muted-foreground">Continue Watching</h2>
                <button
                    type="button"
                    onClick={() => clearAll()}
                    className="ml-auto cursor-pointer text-[10px] tracking-widest uppercase text-muted-foreground/40 hover:text-destructive lg:text-muted-foreground/0 lg:group-hover/section:text-muted-foreground/40 lg:hover:text-destructive transition-colors duration-300">
                    Clear all
                </button>
            </div>

            {/* Edge-to-edge Scroll Carousel */}
            <ScrollCarousel className="-mx-4 lg:mx-0">
                <div className="grid grid-flow-col auto-cols-[160px] sm:auto-cols-[180px] md:auto-cols-[200px] gap-4 pb-4 max-lg:px-4 w-max">
                    {entries.map((entry) => (
                        <ContinueWatchingEntry
                            key={entry.id}
                            entry={entry}
                            play={play}
                            addons={addons}
                            activeRequest={activeRequest}
                            isAddonsLoading={isAddonsLoading}
                            onRemove={handleRemove}
                        />
                    ))}
                </div>
            </ScrollCarousel>
        </section>
    );
});
