import { type TraktMedia } from "@/lib/trakt";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MediaStats } from "./media-stats";
import { memo } from "react";
import { getPosterUrl, getBackdropUrl } from "@/lib/utils/trakt";
import { ArrowUpRightIcon, Play, Star } from "lucide-react";
import { WatchButton } from "@/components/common/watch-button";

interface MediaHeaderProps {
    media: TraktMedia;
    mediaId: string;
    type: "movie" | "show";
}

export const MediaHeader = memo(function MediaHeader({ media, type }: MediaHeaderProps) {
    const posterUrl =
        getPosterUrl(media.images) ||
        `https://placehold.co/300x450/1a1a1a/3e3e3e?text=${encodeURIComponent(media.title)}`;
    const backdropUrl = getBackdropUrl(media.images);

    return (
        <div className="relative">
            {/* Backdrop - Image or Gradient Fallback */}
            {backdropUrl ? (
                <>
                    <div className="absolute inset-0 left-1/2 -translate-x-1/2 w-screen overflow-hidden -mt-6">
                        <img
                            src={backdropUrl}
                            alt=""
                            className="w-full h-full object-cover opacity-50"
                            loading="eager"
                            decoding="async"
                        />
                    </div>
                    <div className="absolute inset-0 left-1/2 -translate-x-1/2 w-screen bg-gradient-to-t from-background via-background/40 to-transparent -mt-6" />
                    <div className="absolute inset-0 left-1/2 -translate-x-1/2 w-screen bg-gradient-to-r from-background/60 via-transparent to-background/60 -mt-6" />
                </>
            ) : (
                <>
                    <div className="absolute inset-0 left-1/2 -translate-x-1/2 w-screen overflow-hidden -mt-6">
                        <img
                            src={posterUrl}
                            alt=""
                            className="w-full h-full object-cover opacity-40 blur-2xl scale-110"
                            loading="eager"
                            decoding="async"
                        />
                    </div>
                    <div className="absolute inset-0 left-1/2 -translate-x-1/2 w-screen bg-gradient-to-t from-background via-background/70 to-background/40 -mt-6" />
                    <div className="absolute inset-0 left-1/2 -translate-x-1/2 w-screen bg-gradient-to-r from-background/70 via-transparent to-background/70 -mt-6" />
                </>
            )}

            {/* Content */}
            <div className="relative pt-[12vh] sm:pt-[20vh] md:pt-[30vh] pb-8">
                <div className="grid md:grid-cols-[180px_1fr] lg:grid-cols-[240px_1fr] gap-6 md:gap-8">
                    {/* Poster Column */}
                    <div className="space-y-4">
                        <div className="max-md:max-w-[45vw] aspect-2/3 overflow-hidden rounded-sm bg-muted/50">
                            <img
                                src={posterUrl}
                                alt={media.title}
                                className="w-full h-full object-cover"
                                loading="eager"
                                decoding="async"
                            />
                        </div>

                        {/* Action Buttons */}
                        <div className="hidden md:flex flex-col gap-2">
                            {type === "movie" && media.ids?.imdb && (
                                <WatchButton imdbId={media.ids.imdb} mediaType="movie" title={media.title || "Movie"}>
                                    <Button size="lg" className="w-full gap-2">
                                        <Play className="size-4 fill-current" />
                                        Watch Now
                                    </Button>
                                </WatchButton>
                            )}
                            {media.trailer && (
                                <Button asChild variant="outline" size="lg" className="w-full">
                                    <Link href={media.trailer} target="_blank" rel="noopener">
                                        Watch Trailer
                                        <ArrowUpRightIcon className="size-4 ml-1.5 opacity-50" />
                                    </Link>
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Info Column */}
                    <div className="space-y-6">
                        {/* Title & Type */}
                        <div className="space-y-3">
                            <div className="text-xs tracking-widest uppercase text-muted-foreground">
                                {type === "movie" ? "Film" : "Series"}
                            </div>
                            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-light leading-tight">{media.title}</h1>
                        </div>

                        {/* Metadata Line */}
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                            {media.year && <span>{media.year}</span>}
                            {media.rating && (
                                <>
                                    <span className="text-border">·</span>
                                    <span className="flex items-center gap-1.5">
                                        <Star className="size-4 fill-[#F5C518] text-[#F5C518]" />
                                        <span className="text-foreground font-medium">{media.rating.toFixed(1)}</span>
                                        <span className="text-muted-foreground/60">/10</span>
                                    </span>
                                </>
                            )}
                            {media.runtime && (
                                <>
                                    <span className="text-border">·</span>
                                    <span>{media.runtime}m</span>
                                </>
                            )}
                            {media.certification && (
                                <>
                                    <span className="text-border">·</span>
                                    <Badge>{media.certification}</Badge>
                                </>
                            )}
                        </div>

                        {/* Genres */}
                        {media.genres && media.genres.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {media.genres.map((genre) => (
                                    <span
                                        key={genre}
                                        className="text-xs text-foreground/80 px-2.5 py-1 bg-muted/50 rounded-sm">
                                        {genre}
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Overview */}
                        {media.overview && (
                            <div className="space-y-2">
                                <p className="text-sm sm:text-base text-foreground/80 leading-relaxed max-w-2xl">
                                    {media.overview}
                                </p>
                            </div>
                        )}

                        {/* Stats */}
                        <MediaStats media={media} type={type} />

                        {/* External Links */}
                        {media.ids && (
                            <div className="flex flex-wrap items-center gap-5 pt-2">
                                {media.homepage && (
                                    <Link
                                        href={media.homepage}
                                        target="_blank"
                                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                                        <ArrowUpRightIcon className="size-4 opacity-60" />
                                        Website
                                    </Link>
                                )}
                                {media.ids?.imdb && (
                                    <Link
                                        href={`https://www.imdb.com/title/${media.ids?.imdb}`}
                                        target="_blank"
                                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                                        <img
                                            src="https://cdn.jsdelivr.net/npm/simple-icons@v14/icons/imdb.svg"
                                            alt=""
                                            className="size-4 opacity-60 dark:invert"
                                        />
                                        IMDb
                                    </Link>
                                )}
                                {media.ids.tmdb && (
                                    <Link
                                        href={`https://www.themoviedb.org/${type}/${media.ids.tmdb}`}
                                        target="_blank"
                                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                                        <img
                                            src="https://cdn.jsdelivr.net/npm/simple-icons@v14/icons/themoviedatabase.svg"
                                            alt=""
                                            className="size-4 opacity-60 dark:invert"
                                        />
                                        TMDB
                                    </Link>
                                )}
                                {media.ids.trakt && (
                                    <Link
                                        href={`https://trakt.tv/${type === "movie" ? "movies" : "shows"}/${media.ids.trakt}`}
                                        target="_blank"
                                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                                        <img
                                            src="https://cdn.jsdelivr.net/npm/simple-icons@v14/icons/trakt.svg"
                                            alt=""
                                            className="size-4 opacity-60 dark:invert"
                                        />
                                        Trakt
                                    </Link>
                                )}
                                {type === "show" && media.ids?.imdb && (
                                    <Link
                                        href={`https://tvcharts.co/show/${media.ids?.imdb}`}
                                        target="_blank"
                                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                                        <ArrowUpRightIcon className="size-4 opacity-60" />
                                        TV Charts
                                    </Link>
                                )}
                            </div>
                        )}

                        {/* Mobile Action Buttons */}
                        <div className="flex md:hidden flex-wrap gap-2 pt-2">
                            {type === "movie" && media.ids?.imdb && (
                                <WatchButton imdbId={media.ids.imdb} mediaType="movie" title={media.title || "Movie"}>
                                    <Button className="gap-2">
                                        <Play className="size-4 fill-current" />
                                        Watch Now
                                    </Button>
                                </WatchButton>
                            )}
                            {media.trailer && (
                                <Button asChild variant="outline">
                                    <Link href={media.trailer} target="_blank" rel="noopener">
                                        Trailer
                                        <ArrowUpRightIcon className="size-4 ml-1 opacity-50" />
                                    </Link>
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
});
