"use client";

import { type TraktMedia, type TraktSeason } from "@/lib/trakt";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, Calendar, Clock, Globe, Film, Tv, ExternalLink, Home } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useTraktShowSeasons, useTraktShowEpisodes, useTraktPeople } from "@/hooks/use-trakt";
import { SeasonCard } from "./season-card";
import { EpisodeCard } from "@/components/mdb/episode-card";
import { PeopleSection } from "./people-section";
import { MediaStats } from "./media-stats";
import { useState, memo } from "react";
import { Sources } from "./sources";

// Seasons section component to avoid complex conditional rendering
function SeasonsSection({
    seasonsData,
    selectedSeason,
    setSelectedSeason,
    mediaId,
}: {
    seasonsData: unknown;
    selectedSeason: number;
    setSelectedSeason: (season: number) => void;
    mediaId: string;
}): React.ReactElement | null {
    const seasons = seasonsData as Array<{ number: number; [key: string]: unknown }>;
    if (!seasons || seasons.length === 0) return null;

    return (
        <div>
            <h3 className="text-base sm:text-lg font-semibold mb-3">Seasons</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
                {seasons.map((season) => (
                    <SeasonCard
                        key={season.number}
                        season={season as unknown as TraktSeason}
                        isSelected={selectedSeason === season.number}
                        onClick={() => setSelectedSeason(season.number)}
                        mediaId={mediaId}
                    />
                ))}
            </div>
        </div>
    );
}

interface MediaDetailsProps {
    media?: TraktMedia;
    mediaId: string;
    type: "movie" | "show";
    isLoading?: boolean;
    error?: Error | null;
}

export const MediaDetails = memo(function MediaDetails({ media, mediaId, type, isLoading, error }: MediaDetailsProps) {
    const [selectedSeason, setSelectedSeason] = useState<number>(1);

    // Fetch additional data for shows
    const seasonsQuery = useTraktShowSeasons(mediaId);
    const episodesQuery = useTraktShowEpisodes(mediaId, selectedSeason);

    // Fetch people data
    const peopleQuery = useTraktPeople(mediaId, type === "movie" ? "movies" : "shows");
    if (error) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="text-center space-y-2">
                    <p className="text-2xl font-semibold">Failed to load details</p>
                    <p className="text-muted-foreground">{error.message}</p>
                </div>
            </div>
        );
    }

    if (isLoading || !media) {
        return (
            <div className="relative min-h-screen">
                {/* Banner skeleton */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-screen -mt-6 h-[40vh] max-h-[600px]">
                    <Skeleton className="w-full h-full" />
                </div>

                {/* Content skeleton */}
                <div className="relative pt-[20vh] sm:pt-[22vh] md:pt-[25vh] pb-20 space-y-6">
                    <div className="grid md:grid-cols-[200px_1fr] lg:grid-cols-[300px_1fr] gap-3 md:gap-6">
                        <Skeleton className="aspect-2/3 rounded-lg w-full max-w-[50vw] sm:max-w-none" />
                        <div className="space-y-4">
                            <Skeleton className="h-8 sm:h-10 w-3/4" />
                            <div className="flex gap-3 sm:gap-4">
                                <Skeleton className="h-5 sm:h-6 w-16 sm:w-20" />
                                <Skeleton className="h-5 sm:h-6 w-16 sm:w-20" />
                                <Skeleton className="h-5 sm:h-6 w-16 sm:w-20" />
                            </div>
                            <Skeleton className="h-20 sm:h-24 w-full" />
                            <div className="grid grid-cols-2 gap-3 sm:gap-4">
                                <Skeleton className="h-16 sm:h-20" />
                                <Skeleton className="h-16 sm:h-20" />
                                <Skeleton className="h-16 sm:h-20" />
                                <Skeleton className="h-16 sm:h-20" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

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
                        {}
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

            {/* Content Section */}
            <div
                className={
                    backdropUrl
                        ? "relative pt-[20vh] sm:pt-[22vh] md:pt-[25vh] pb-20 flex flex-col gap-8"
                        : "flex flex-col gap-8"
                }>
                <div className="grid md:grid-cols-[200px_1fr] lg:grid-cols-[300px_1fr] gap-3 md:gap-6">
                    <div className="space-y-2 md:space-y-4">
                        <div className="max-sm:max-w-[50vw] aspect-2/3 overflow-hidden rounded-lg">
                            {}
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
                                    {type === "show" && (
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

                {/* Sources Section for Movies */}
                {type === "movie" && media?.ids?.imdb && (
                    <div className="space-y-4">
                        <h2 className="text-lg sm:text-xl font-bold" id="sources">
                            Available Sources
                        </h2>
                        <Sources imdbId={media.ids.imdb} mediaType="movie" />
                    </div>
                )}

                {/* Seasons & Episodes for TV Shows */}
                {type === "show" && (
                    <div className="space-y-4">
                        <h2 className="text-lg sm:text-xl font-bold">Seasons & Episodes</h2>

                        {/* Seasons */}
                        <SeasonsSection
                            seasonsData={seasonsQuery.data}
                            selectedSeason={selectedSeason}
                            setSelectedSeason={setSelectedSeason}
                            mediaId={mediaId}
                        />

                        {/* Episodes */}
                        {episodesQuery.data && episodesQuery.data.length > 0 && (
                            <div>
                                <h3 className="text-base sm:text-lg font-semibold mb-4" id="sources">
                                    {selectedSeason === 0 ? "Specials" : `Season ${selectedSeason}`} Episodes
                                </h3>
                                <div className="flex flex-col gap-3 sm:gap-4">
                                    {episodesQuery.data.map((episode) => (
                                        <EpisodeCard key={episode.number} episode={episode} imdbId={media.ids?.imdb} />
                                    ))}
                                </div>
                            </div>
                        )}

                        {seasonsQuery.isLoading && (
                            <div className="space-y-3">
                                <h3 className="text-base sm:text-lg font-semibold">Seasons</h3>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <Skeleton key={i} className="aspect-2/3 rounded-lg" />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Cast Section */}
                <PeopleSection people={peopleQuery.data} isLoading={peopleQuery.isLoading} error={peopleQuery.error} />
            </div>
        </div>
    );
});
