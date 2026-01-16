"use client";

import { type TraktEpisode } from "@/lib/trakt";
import { Badge } from "@/components/ui/badge";
import { Star, Calendar, Clock, GlobeIcon, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { memo, useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Sources } from "./sources";

interface EpisodeCardProps {
    episode: TraktEpisode;
    className?: string;
    imdbId?: string;
}

export const EpisodeCard = memo(function EpisodeCard({ episode, className, imdbId }: EpisodeCardProps) {
    const [isOpen, setIsOpen] = useState(false);

    const screenshotUrl = episode.images?.screenshot?.[0]
        ? `https://${episode.images.screenshot[0]}`
        : `https://placehold.co/400x225/1a1a1a/white?text=Episode+${episode.number}`;

    const formatDate = (dateString?: string) => {
        if (!dateString) return null;
        return new Date(dateString).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    };

    return (
        <Collapsible open={isOpen} onOpenChange={setIsOpen} className={cn("group", className)}>
            <div className="bg-card rounded-lg border overflow-hidden hover:border-primary/50 transition-all hover:shadow-md">
                <CollapsibleTrigger asChild>
                    <button className="w-full text-left p-0 border-0 bg-transparent">
                        <div className="flex flex-col sm:flex-row gap-0 sm:gap-4">
                            {/* Episode thumbnail */}
                            <div className="relative w-full sm:w-56 md:w-64 shrink-0 aspect-video bg-muted overflow-hidden">
                                {}
                                <img
                                    src={screenshotUrl}
                                    alt={episode.title}
                                    className="absolute inset-0 w-full h-full object-cover transition-transform group-hover:scale-105"
                                    loading="lazy"
                                />

                                {/* Gradient overlay */}
                                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />

                                {/* Play button overlay */}
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <div className="bg-black/60 backdrop-blur-sm rounded-full p-2 sm:p-3 flex items-center gap-1.5 sm:gap-2">
                                        <GlobeIcon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                                        <span className="text-white text-xs sm:text-sm font-medium">
                                            {isOpen ? "Hide Sources" : "Show Sources"}
                                        </span>
                                    </div>
                                </div>

                                {/* Episode number badge */}
                                <div className="absolute top-2 left-2">
                                    <Badge variant="secondary" className="text-xs font-bold shadow-md">
                                        E{episode.number}
                                    </Badge>
                                </div>

                                {/* Rating badge */}
                                {episode.rating && (
                                    <div className="absolute top-2 right-2">
                                        <Badge
                                            variant="outline"
                                            className="text-xs bg-black/60 backdrop-blur-sm border-white/20 text-white">
                                            <Star className="h-3 w-3 fill-yellow-500 text-yellow-500 mr-1" />
                                            {episode.rating.toFixed(1)}
                                        </Badge>
                                    </div>
                                )}
                            </div>

                            {/* Episode details */}
                            <div className="flex-1 p-3 sm:py-3 sm:pr-4 sm:pl-0 space-y-2 sm:space-y-3 min-w-0">
                                <div className="space-y-1.5">
                                    <div className="flex items-start justify-between gap-2">
                                        <h4 className="font-semibold text-sm sm:text-base md:text-lg line-clamp-1 group-hover:text-primary transition-colors">
                                            {episode.title || `Episode ${episode.number}`}
                                        </h4>
                                        <ChevronDown
                                            className={cn(
                                                "h-4 w-4 sm:h-5 sm:w-5 shrink-0 text-muted-foreground transition-transform",
                                                isOpen && "rotate-180"
                                            )}
                                        />
                                    </div>

                                    {episode.overview && (
                                        <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 sm:line-clamp-3 leading-relaxed">
                                            {episode.overview}
                                        </p>
                                    )}
                                </div>

                                <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                                    {episode.first_aired && (
                                        <div className="flex items-center gap-1.5">
                                            <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                            <span>{formatDate(episode.first_aired)}</span>
                                        </div>
                                    )}

                                    {episode.runtime && (
                                        <div className="flex items-center gap-1.5">
                                            <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                            <span>{episode.runtime}m</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </button>
                </CollapsibleTrigger>

                <CollapsibleContent>
                    {isOpen && (
                        <div className="border-t px-3 sm:px-4 py-3 sm:py-4 bg-muted/20">
                            <div className="mb-2 text-sm font-medium text-muted-foreground">Available Sources</div>
                            <Sources
                                imdbId={imdbId}
                                mediaType="show"
                                tvParams={
                                    episode.season ? { season: episode.season, episode: episode.number } : undefined
                                }
                            />
                        </div>
                    )}
                </CollapsibleContent>
            </div>
        </Collapsible>
    );
});
