"use client";

import { ChevronDown, Play, Star } from "lucide-react";
import { memo, useState } from "react";
import { WatchButton } from "@/components/common/watch-button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { TraktEpisode, TraktMedia } from "@/lib/trakt";
import { cn, formatLocalizedDate } from "@/lib/utils";
import { Sources } from "./sources";

interface ThumbnailContentProps {
    screenshotUrl: string;
    title?: string;
    episodeLabel: string;
    interactive?: boolean;
}

const ThumbnailContent = memo(function ThumbnailContent({
    screenshotUrl,
    title,
    episodeLabel,
    interactive,
}: ThumbnailContentProps) {
    return (
        <>
            <img
                key={screenshotUrl}
                src={screenshotUrl}
                alt={title}
                className={cn(
                    "absolute inset-0 w-full h-full object-cover",
                    interactive && "transition-transform duration-500 ease-out group-hover/thumb:scale-105"
                )}
                loading="lazy"
            />
            {/* Subtle corner wash — only behind the chapter label, not noticeable elsewhere */}
            <div className="absolute top-0 left-0 w-24 h-12 sm:w-28 sm:h-14 bg-[radial-gradient(ellipse_at_top_left,rgba(0,0,0,0.55),transparent_70%)] pointer-events-none" />
            {/* Editorial chapter marker — filmstrip frame ID */}
            <div className="absolute top-2 left-2 sm:top-2.5 sm:left-2.5 flex items-baseline gap-2 [text-shadow:0_1px_2px_rgb(0_0_0/0.6)]">
                <span className="text-[10px] tracking-[0.25em] uppercase text-white/80">Ep</span>
                <span className="text-sm sm:text-base font-light tabular-nums leading-none text-white">
                    {episodeLabel}
                </span>
            </div>
            {interactive && (
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 transition-opacity duration-300 bg-black/30">
                    <span className="flex items-center gap-1.5 text-[10px] sm:text-xs tracking-[0.25em] uppercase text-white border border-white/40 px-3 py-1.5 rounded-sm backdrop-blur-sm">
                        <Play className="size-3 fill-current" />
                        Watch
                    </span>
                </div>
            )}
        </>
    );
});

interface EpisodeCardProps {
    episode: TraktEpisode;
    className?: string;
    imdbId?: string;
    showMedia?: TraktMedia;
}

export const EpisodeCard = memo(function EpisodeCard({ episode, className, imdbId, showMedia }: EpisodeCardProps) {
    const [isOpen, setIsOpen] = useState(false);

    const episodeLabel = String(episode.number).padStart(2, "0");
    const screenshotUrl = episode.images?.screenshot?.[0]
        ? `https://${episode.images.screenshot[0]}`
        : `https://placehold.co/400x225/1a1a1a/3e3e3e?text=${episodeLabel}`;

    // Specials eps have season number 0, so those episodes wont work
    const tvParams = episode.season
        ? { season: episode.season, episode: episode.number, title: episode.title }
        : undefined;

    const thumbnailClass =
        "relative w-40 sm:w-52 md:w-60 shrink-0 aspect-video bg-muted/30 overflow-hidden sm:rounded-sm";

    return (
        <Collapsible open={isOpen} onOpenChange={setIsOpen} className={cn("group", className)}>
            <div className="overflow-hidden transition-colors border-y border-x-0 sm:border sm:border-x sm:rounded-sm border-border/40 group-hover:border-border">
                <div className="flex flex-row items-stretch">
                    {/* Thumbnail */}
                    {imdbId && showMedia ? (
                        <WatchButton request={{ imdbId, type: "show", media: showMedia, tvParams }}>
                            <button type="button" className={cn(thumbnailClass, "cursor-pointer group/thumb")}>
                                <ThumbnailContent
                                    screenshotUrl={screenshotUrl}
                                    title={episode.title}
                                    episodeLabel={episodeLabel}
                                    interactive
                                />
                            </button>
                        </WatchButton>
                    ) : (
                        <div className={thumbnailClass}>
                            <ThumbnailContent
                                screenshotUrl={screenshotUrl}
                                title={episode.title}
                                episodeLabel={episodeLabel}
                            />
                        </div>
                    )}

                    {/* Editorial caption — clickable to expand sources */}
                    <CollapsibleTrigger asChild>
                        <button
                            type="button"
                            className="flex-1 min-w-0 px-2.5 py-2 sm:px-3.5 sm:py-3 md:px-4 md:py-3.5 text-left cursor-pointer flex flex-col gap-1 sm:gap-1.5">
                            {/* Title row + chevron */}
                            <div className="flex items-start justify-between gap-2">
                                <h4
                                    className={cn(
                                        "flex-1 min-w-0 text-sm sm:text-base md:text-lg font-light leading-snug line-clamp-1 sm:line-clamp-2 transition-colors",
                                        isOpen ? "text-foreground" : "group-hover:text-foreground"
                                    )}>
                                    {episode.title || `Episode ${episode.number}`}
                                </h4>
                                <ChevronDown
                                    className={cn(
                                        "size-3.5 sm:size-4 mt-1 shrink-0 transition-transform duration-300",
                                        isOpen ? "rotate-180 text-primary" : "text-muted-foreground/70"
                                    )}
                                />
                            </div>

                            {/* Meta row — rating · date · runtime */}
                            {(!!episode.rating || episode.first_aired || episode.runtime) && (
                                <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[10px] sm:text-[11px] text-muted-foreground">
                                    {!!episode.rating && (
                                        <span className="inline-flex items-center gap-1 text-foreground/80">
                                            <Star className="size-3 fill-[#F5C518] text-[#F5C518] -translate-y-px" />
                                            <span className="tabular-nums">{episode.rating.toFixed(1)}</span>
                                        </span>
                                    )}
                                    {!!episode.rating && (episode.first_aired || episode.runtime) && (
                                        <span className="text-border">·</span>
                                    )}
                                    {episode.first_aired && (
                                        <span className="uppercase tracking-wider">
                                            {formatLocalizedDate(episode.first_aired)}
                                        </span>
                                    )}
                                    {episode.first_aired && episode.runtime && <span className="text-border">·</span>}
                                    {episode.runtime && <span className="tabular-nums">{episode.runtime}m</span>}
                                </div>
                            )}

                            {/* Overview */}
                            {episode.overview && (
                                <p className="text-[10px] sm:text-sm text-muted-foreground leading-relaxed line-clamp-2">
                                    {episode.overview}
                                </p>
                            )}
                        </button>
                    </CollapsibleTrigger>
                </div>

                <CollapsibleContent>
                    {isOpen && imdbId && showMedia && (
                        <div className="bg-muted/20 border-t border-border/40">
                            <Sources
                                request={{ imdbId, type: "show", tvParams, media: showMedia }}
                                className="border-x-0 border-b-0 rounded-none"
                            />
                        </div>
                    )}
                </CollapsibleContent>
            </div>
        </Collapsible>
    );
});
