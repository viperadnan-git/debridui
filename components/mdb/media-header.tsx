import { ArrowUpRightIcon, Play, Star } from "lucide-react";
import Link from "next/link";
import { memo } from "react";
import { WatchButton } from "@/components/common/watch-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { TraktMedia } from "@/lib/trakt";
import { getBackdropUrl, getPosterUrl } from "@/lib/utils/media";
import { MediaOverview } from "./media-overview";
import { MediaStats } from "./media-stats";

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
    const kicker = type === "movie" ? "Film" : "Series";

    return (
        <div className="relative">
            {/* Backdrop — shorter on mobile, taller from md up */}
            <div className="absolute inset-x-0 top-0 -mt-6 h-[42vh] sm:h-[50vh] md:h-[60vh] lg:h-[85vh] overflow-hidden left-1/2 -translate-x-1/2 w-screen">
                {backdropUrl ? (
                    <img
                        src={backdropUrl}
                        alt=""
                        className="w-full h-full object-cover opacity-50"
                        loading="eager"
                        decoding="async"
                    />
                ) : (
                    <img
                        src={posterUrl}
                        alt=""
                        className="w-full h-full object-cover opacity-40 blur-2xl scale-110"
                        loading="eager"
                        decoding="async"
                    />
                )}
                <div className="absolute inset-0 bg-linear-to-t from-background via-background/60 to-transparent" />
                <div className="absolute inset-0 bg-linear-to-r from-background/70 via-transparent to-background/70" />
            </div>

            {/* Content */}
            <div className="relative pt-[16vh] sm:pt-[20vh] md:pt-[26vh] lg:pt-[30vh] pb-4 md:pb-6 lg:pb-8">
                <div className="grid md:grid-cols-[200px_1fr] lg:grid-cols-[240px_1fr] gap-5 md:gap-8">
                    {/* Mobile/Tablet: poster + title side-by-side. Desktop: poster column only. */}
                    <div className="flex gap-4 md:block md:space-y-4">
                        <div className="w-24 sm:w-32 md:w-full shrink-0 aspect-2/3 overflow-hidden rounded-sm bg-muted/30 ring-1 ring-border/40 shadow-2xl shadow-black/40">
                            <img
                                src={posterUrl}
                                alt={media.title}
                                className="w-full h-full object-cover"
                                loading="eager"
                                decoding="async"
                            />
                        </div>

                        {/* Mobile title block — sits next to poster */}
                        <div className="flex-1 min-w-0 flex flex-col justify-end gap-2 md:hidden">
                            <div className="text-[10px] tracking-[0.25em] uppercase text-muted-foreground">
                                {kicker}
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-light leading-[1.1] line-clamp-3">
                                {media.title}
                            </h1>
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                                {media.year && <span>{media.year}</span>}
                                {media.rating && (
                                    <>
                                        <span className="text-border">·</span>
                                        <span className="inline-flex items-center gap-1">
                                            <Star className="size-3 fill-[#F5C518] text-[#F5C518]" />
                                            <span className="text-foreground font-medium">
                                                {media.rating.toFixed(1)}
                                            </span>
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
                                        <Badge className="text-[10px] px-1.5 py-0">{media.certification}</Badge>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Desktop action buttons under poster */}
                        <div className="hidden md:flex flex-col gap-2">
                            {type === "movie" && media.ids?.imdb && (
                                <WatchButton request={{ imdbId: media.ids.imdb, type: "movie", media }}>
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
                    <div className="space-y-4 md:space-y-5 lg:space-y-6">
                        {/* Desktop-only title block (mobile shows it next to poster) */}
                        <div className="hidden md:block space-y-3">
                            <div className="text-xs tracking-[0.25em] uppercase text-muted-foreground">{kicker}</div>
                            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-light leading-tight">{media.title}</h1>
                        </div>

                        {/* Mobile primary action — placed right after title for thumb reach */}
                        {type === "movie" && media.ids?.imdb && (
                            <div className="md:hidden flex gap-2">
                                <WatchButton request={{ imdbId: media.ids.imdb, type: "movie", media }}>
                                    <Button className="flex-1 gap-2">
                                        <Play className="size-4 fill-current" />
                                        Watch Now
                                    </Button>
                                </WatchButton>
                                {media.trailer && (
                                    <Button asChild variant="outline" size="icon" aria-label="Trailer">
                                        <Link href={media.trailer} target="_blank" rel="noopener">
                                            <ArrowUpRightIcon className="size-4" />
                                        </Link>
                                    </Button>
                                )}
                            </div>
                        )}

                        {/* Desktop metadata line */}
                        <div className="hidden md:flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
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
                            <div className="flex flex-wrap gap-1.5 md:gap-2">
                                {media.genres.map((genre) => (
                                    <span
                                        key={genre}
                                        className="text-[11px] md:text-xs text-foreground/80 px-2 md:px-2.5 py-0.5 md:py-1 bg-muted/50 rounded-sm">
                                        {genre}
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Overview */}
                        {media.overview && <MediaOverview text={media.overview} />}

                        {/* Stats */}
                        <MediaStats media={media} type={type} />

                        {/* External Links — compact, text always visible */}
                        {media.ids && (
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs sm:gap-x-4 sm:text-sm lg:gap-x-5 lg:gap-y-2 lg:pt-1">
                                {media.homepage && (
                                    <Link
                                        href={media.homepage}
                                        target="_blank"
                                        className="inline-flex items-center gap-1.5 lg:gap-2 text-muted-foreground hover:text-foreground transition-colors">
                                        <ArrowUpRightIcon className="size-3.5 lg:size-4 opacity-60" />
                                        Website
                                    </Link>
                                )}
                                {media.ids?.imdb && (
                                    <Link
                                        href={`https://www.imdb.com/title/${media.ids?.imdb}`}
                                        target="_blank"
                                        className="inline-flex items-center gap-1.5 lg:gap-2 text-muted-foreground hover:text-foreground transition-colors">
                                        <img
                                            src="https://cdn.jsdelivr.net/npm/simple-icons@v14/icons/imdb.svg"
                                            alt=""
                                            className="size-3.5 lg:size-4 opacity-60 dark:invert"
                                        />
                                        IMDb
                                    </Link>
                                )}
                                {media.ids.tmdb && (
                                    <Link
                                        href={`https://www.themoviedb.org/${type}/${media.ids.tmdb}`}
                                        target="_blank"
                                        className="inline-flex items-center gap-1.5 lg:gap-2 text-muted-foreground hover:text-foreground transition-colors">
                                        <img
                                            src="https://cdn.jsdelivr.net/npm/simple-icons@v14/icons/themoviedatabase.svg"
                                            alt=""
                                            className="size-3.5 lg:size-4 opacity-60 dark:invert"
                                        />
                                        TMDB
                                    </Link>
                                )}
                                {media.ids.trakt && (
                                    <Link
                                        href={`https://trakt.tv/${type === "movie" ? "movies" : "shows"}/${media.ids.trakt}`}
                                        target="_blank"
                                        className="inline-flex items-center gap-1.5 lg:gap-2 text-muted-foreground hover:text-foreground transition-colors">
                                        <img
                                            src="https://cdn.jsdelivr.net/npm/simple-icons@v14/icons/trakt.svg"
                                            alt=""
                                            className="size-3.5 lg:size-4 opacity-60 dark:invert"
                                        />
                                        Trakt
                                    </Link>
                                )}
                                {type === "show" && media.ids?.imdb && (
                                    <Link
                                        href={`https://tvcharts.co/show/${media.ids?.imdb}`}
                                        target="_blank"
                                        className="inline-flex items-center gap-1.5 lg:gap-2 text-muted-foreground hover:text-foreground transition-colors">
                                        <ArrowUpRightIcon className="size-3.5 lg:size-4 opacity-60" />
                                        TV Charts
                                    </Link>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
});
