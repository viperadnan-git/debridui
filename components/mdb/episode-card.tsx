"use client";

import { type TraktEpisode } from "@/lib/trakt";
import { ChevronDown, Play, Star } from "lucide-react";
import { cn, formatLocalizedDate } from "@/lib/utils";
import { memo, useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { WatchButton } from "@/components/common/watch-button";
import { Sources } from "./sources";

interface ThumbnailContentProps {
    screenshotUrl: string;
    title?: string;
    episodeLabel: string;
    rating?: number;
    interactive?: boolean;
}

const ThumbnailContent = memo(function ThumbnailContent({
    screenshotUrl,
    title,
    episodeLabel,
    rating,
    interactive,
}: ThumbnailContentProps) {
    return (
        <>
            <img
                src={screenshotUrl}
                alt={title}
                className={cn(
                    "absolute inset-0 w-full h-full object-cover",
                    interactive && "transition-transform duration-300 group-hover/thumb:scale-hover"
                )}
                loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <span className="absolute top-1.5 left-1.5 sm:top-2.5 sm:left-2.5 text-xs font-medium tracking-wider text-white/90 bg-black/60 backdrop-blur-sm px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-sm">
                E{episodeLabel}
            </span>
            {rating && (
                <span className="absolute top-1.5 right-1.5 sm:top-2.5 sm:right-2.5 hidden sm:inline-flex items-center gap-1 text-xs font-medium text-white/90 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-sm">
                    <Star className="size-3 fill-[#F5C518] text-[#F5C518]" />
                    {rating.toFixed(1)}
                </span>
            )}
            {interactive && (
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 transition-opacity duration-300">
                    <span className="flex items-center gap-1.5 text-xs tracking-wider uppercase text-white bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-sm">
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
    showTitle?: string;
}

export const EpisodeCard = memo(function EpisodeCard({ episode, className, imdbId, showTitle }: EpisodeCardProps) {
    const [isOpen, setIsOpen] = useState(false);

    const episodeLabel = String(episode.number).padStart(2, "0");
    const screenshotUrl = episode.images?.screenshot?.[0]
        ? `https://${episode.images.screenshot[0]}`
        : `https://placehold.co/400x225/1a1a1a/3e3e3e?text=${episodeLabel}`;

    const mediaTitle =
        showTitle && episode.season
            ? `${showTitle} S${episode.season.toString().padStart(2, "0")} E${episode.number.toString().padStart(2, "0")}${episode.title ? ` - ${episode.title}` : ""}`
            : episode.title || `Episode ${episode.number}`;

    const tvParams = episode.season ? { season: episode.season, episode: episode.number } : undefined;

    const thumbnailClass =
        "relative w-36 sm:w-56 md:w-60 shrink-0 aspect-[5/3] sm:aspect-video bg-muted/30 overflow-hidden";

    return (
        <Collapsible open={isOpen} onOpenChange={setIsOpen} className={cn("group", className)}>
            <div className="rounded-sm border border-border/50 overflow-hidden">
                <div className="flex flex-row items-start">
                    {/* Episode thumbnail - clickable to watch */}
                    {imdbId ? (
                        <WatchButton imdbId={imdbId} mediaType="show" title={mediaTitle} tvParams={tvParams}>
                            <button className={cn(thumbnailClass, "cursor-pointer group/thumb")}>
                                <ThumbnailContent
                                    screenshotUrl={screenshotUrl}
                                    title={episode.title}
                                    episodeLabel={episodeLabel}
                                    rating={episode.rating}
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
                                rating={episode.rating}
                            />
                        </div>
                    )}

                    {/* Episode details - clickable to toggle sources */}
                    <CollapsibleTrigger asChild>
                        <button className="flex-1 px-2.5 py-1.5 sm:p-3 md:p-4 text-left cursor-pointer min-w-0">
                            <div className="flex items-start justify-between gap-2">
                                <div className="space-y-0.5 sm:space-y-1 min-w-0">
                                    <h4 className="text-sm sm:text-base font-medium line-clamp-1 group-hover:text-foreground/80 transition-colors">
                                        {episode.title || `Episode ${episode.number}`}
                                    </h4>
                                    <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-sm text-muted-foreground">
                                        {episode.first_aired && <span>{formatLocalizedDate(episode.first_aired)}</span>}
                                        {episode.first_aired && episode.runtime && (
                                            <span className="text-border">·</span>
                                        )}
                                        {episode.runtime && <span>{episode.runtime}m</span>}
                                    </div>
                                </div>
                                <ChevronDown
                                    className={cn(
                                        "size-4 shrink-0 text-muted-foreground transition-transform duration-300",
                                        isOpen && "rotate-180"
                                    )}
                                />
                            </div>
                            {episode.overview && (
                                <p className="text-[10px] sm:text-sm text-muted-foreground line-clamp-2 leading-relaxed mt-1 sm:mt-1.5 md:mt-2">
                                    {episode.overview}
                                </p>
                            )}
                        </button>
                    </CollapsibleTrigger>
                </div>

                <CollapsibleContent>
                    {isOpen && imdbId && (
                        <div className="border-t border-border/50 bg-muted/20">
                            <div className="px-4 py-3">
                                <span className="text-xs tracking-widest uppercase text-muted-foreground">
                                    Available Sources
                                </span>
                            </div>
                            <Sources
                                imdbId={imdbId}
                                mediaType="show"
                                tvParams={tvParams}
                                mediaTitle={mediaTitle}
                                className="border-x-0 border-b-0 rounded-none"
                            />
                        </div>
                    )}
                </CollapsibleContent>
            </div>
        </Collapsible>
    );
});
