"use client";

import { type TraktMedia } from "@/lib/trakt";
import { Badge } from "@/components/ui/badge";
import { Star, Calendar, Clock, Film, Tv, ExternalLink, Home, Globe } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MediaStats } from "../media-stats";
import { memo } from "react";

interface MediaHeaderProps {
    media: TraktMedia;
    mediaId: string;
    type: "movie" | "show";
}

export const MediaHeader = memo(function MediaHeader({ media, type }: MediaHeaderProps) {
    const posterUrl = media.images?.poster?.[0]
        ? `https://${media.images.poster[0]}`
        : `https://placehold.co/300x450/1a1a1a/white?text=${encodeURIComponent(media.title)}`;

    const backdropUrl = media.images?.fanart?.[0]
        ? `https://${media.images.fanart[0]}`
        : media.images?.banner?.[0]
          ? `https://${media.images.banner[0]}`
          : null;

    return (
        <div className="relative">
            {backdropUrl && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-screen -mt-6 pointer-events-none">
                    <div className="aspect-video overflow-hidden">
                        <img
                            src={backdropUrl}
                            alt={media.title}
                            className="w-full h-full object-cover opacity-60"
                            loading="lazy"
                            decoding="async"
                        />
                        <div className="absolute inset-0 bg-linear-to-t from-background via-background/50 to-transparent" />
                    </div>
                </div>
            )}

            <div className={backdropUrl ? "relative pt-[20vh] sm:pt-[22vh] md:pt-[25vh] pb-8" : "pb-8"}>
                <div className="grid md:grid-cols-[200px_1fr] lg:grid-cols-[300px_1fr] gap-3 md:gap-6">
                    <div className="space-y-2 md:space-y-4">
                        <div className="max-sm:max-w-[50vw] aspect-2/3 overflow-hidden rounded-lg">
                            <img
                                src={posterUrl}
                                alt={media.title}
                                className="w-full h-full object-cover"
                                loading="lazy"
                                decoding="async"
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            {media.homepage && (
                                <Link href={media.homepage} target="_blank" rel="noopener">
                                    <Button variant="outline" className="w-full gap-2">
                                        <Home className="h-4 w-4" />
                                        Official Website
                                    </Button>
                                </Link>
                            )}

                            {media.trailer && (
                                <Link href={media.trailer} target="_blank" rel="noopener">
                                    <Button variant="outline" className="w-full gap-2">
                                        <ExternalLink className="h-4 w-4" />
                                        Watch Trailer
                                    </Button>
                                </Link>
                            )}
                        </div>
                    </div>

                    <div className="space-y-4 md:space-y-6">
                        <div>
                            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2">{media.title}</h1>

                            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                                {media.year && (
                                    <div className="flex items-center gap-1 text-muted-foreground text-xs sm:text-sm">
                                        <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                                        {media.year}
                                    </div>
                                )}

                                {media.rating && (
                                    <div className="flex items-center gap-1 text-xs sm:text-sm">
                                        <Star className="h-3 w-3 sm:h-4 sm:w-4 fill-yellow-500 text-yellow-500" />
                                        <span className="font-semibold">{media.rating.toFixed(1)}</span>
                                        <span className="text-muted-foreground">/10</span>
                                        {media.votes && (
                                            <span className="text-muted-foreground text-xs sm:text-sm">
                                                ({media.votes.toLocaleString()} votes)
                                            </span>
                                        )}
                                    </div>
                                )}

                                {media.runtime && (
                                    <div className="flex items-center gap-1 text-muted-foreground text-xs sm:text-sm">
                                        <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                                        {media.runtime} min
                                    </div>
                                )}

                                {media.certification && (
                                    <Badge variant="outline" className="text-xs">
                                        {media.certification}
                                    </Badge>
                                )}

                                <Badge variant="secondary" className="text-xs">
                                    {type === "movie" ? (
                                        <Film className="h-3 w-3 mr-1" />
                                    ) : (
                                        <Tv className="h-3 w-3 mr-1" />
                                    )}
                                    {type === "movie" ? "Movie" : "TV Show"}
                                </Badge>
                            </div>

                            {media.genres && media.genres.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {media.genres.map((genre) => (
                                        <Badge key={genre} variant="outline">
                                            {genre}
                                        </Badge>
                                    ))}
                                </div>
                            )}
                        </div>

                        {media.overview && (
                            <div>
                                <h2 className="text-xl font-semibold mb-2">Overview</h2>
                                <p className="text-muted-foreground leading-relaxed">{media.overview}</p>
                            </div>
                        )}

                        <MediaStats media={media} type={type} />

                        {media.ids && (
                            <div>
                                <h2 className="text-xl font-semibold mb-2">External</h2>
                                <div className="flex flex-wrap gap-2">
                                    {media.ids.imdb && (
                                        <Link href={`https://www.imdb.com/title/${media.ids.imdb}`} target="_blank">
                                            <Badge variant="secondary" className="cursor-pointer hover:bg-secondary/80">
                                                <Globe className="h-3 w-3 mr-1" />
                                                IMDb
                                            </Badge>
                                        </Link>
                                    )}
                                    {media.ids.tmdb && (
                                        <Link
                                            href={`https://www.themoviedb.org/${type}/${media.ids.tmdb}`}
                                            target="_blank">
                                            <Badge variant="secondary" className="cursor-pointer hover:bg-secondary/80">
                                                <Globe className="h-3 w-3 mr-1" />
                                                TMDB
                                            </Badge>
                                        </Link>
                                    )}
                                    {media.ids.trakt && (
                                        <Link
                                            href={`https://trakt.tv/${type === "movie" ? "movies" : "shows"}/${media.ids.trakt}`}
                                            target="_blank">
                                            <Badge variant="secondary" className="cursor-pointer hover:bg-secondary/80">
                                                <Globe className="h-3 w-3 mr-1" />
                                                Trakt
                                            </Badge>
                                        </Link>
                                    )}
                                    {type === "show" && media.ids.imdb && (
                                        <Link href={`https://tvcharts.co/show/${media.ids.imdb}`} target="_blank">
                                            <Badge variant="secondary">
                                                <Globe className="h-3 w-3 mr-1" />
                                                TV Charts
                                            </Badge>
                                        </Link>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
});
