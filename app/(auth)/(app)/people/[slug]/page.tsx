"use client";

import { useParams } from "next/navigation";
import { memo, useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useTraktPerson, useTraktPersonMovies, useTraktPersonShows } from "@/hooks/use-trakt";
import {
    type TraktPersonFull,
    type TraktPersonMovieCredit,
    type TraktPersonShowCredit,
    type TraktMedia,
} from "@/lib/trakt";
import { MdbFooter } from "@/components/mdb/mdb-footer";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, ChevronDown, ChevronUp, Calendar, MapPin, Skull, Star } from "lucide-react";
import { getPosterUrl } from "@/lib/utils/media";
import { formatLocalizedDate, calculateAge } from "@/lib/utils";

// Person Header Component
const PersonHeader = memo(function PersonHeader({
    person,
    isLoading,
}: {
    person?: TraktPersonFull;
    isLoading: boolean;
}) {
    const [bioExpanded, setBioExpanded] = useState(false);

    if (isLoading) {
        return (
            <div className="relative">
                {/* Backdrop skeleton */}
                <div className="absolute inset-0 left-1/2 -translate-x-1/2 w-screen overflow-hidden -mt-6">
                    <Skeleton className="w-full h-full rounded-none" />
                </div>
                {/* Content */}
                <div className="relative pt-[12vh] sm:pt-[20vh] md:pt-[30vh] pb-8">
                    <div className="grid md:grid-cols-[180px_1fr] lg:grid-cols-[240px_1fr] gap-6 md:gap-8">
                        {/* Headshot skeleton */}
                        <div className="space-y-4">
                            <Skeleton className="max-md:max-w-[45vw] aspect-2/3 rounded-sm" />
                        </div>
                        {/* Info skeleton */}
                        <div className="space-y-6">
                            {/* Department label */}
                            <div className="space-y-3">
                                <Skeleton className="h-3 w-16" />
                                <Skeleton className="h-10 sm:h-12 w-3/4" />
                            </div>
                            {/* Metadata line */}
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-4 w-40" />
                            </div>
                            {/* Biography */}
                            <div className="space-y-2 max-w-2xl">
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-3/4" />
                            </div>
                            {/* External links */}
                            <div className="flex flex-wrap items-center gap-5 pt-2">
                                <Skeleton className="h-5 w-16" />
                                <Skeleton className="h-5 w-16" />
                                <Skeleton className="h-5 w-16" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!person) return null;

    const headshotUrl = person.images?.headshot?.[0] ? `https://${person.images.headshot[0]}` : null;

    const fanartUrl = person.images?.fanart?.[0] ? `https://${person.images.fanart[0]}` : null;

    const age = calculateAge(person.birthday, person.death);
    const biographyLines = person.biography?.split("\n").filter(Boolean) || [];
    const shouldTruncate = biographyLines.length > 3 || (person.biography?.length || 0) > 400;
    const displayBio = bioExpanded ? person.biography : person.biography?.slice(0, 400);

    return (
        <div className="relative">
            {/* Backdrop - Image or Gradient Fallback */}
            {fanartUrl ? (
                <>
                    <div className="absolute inset-0 left-1/2 -translate-x-1/2 w-screen overflow-hidden -mt-6">
                        <img
                            src={fanartUrl}
                            alt=""
                            className="w-full h-full object-cover opacity-30"
                            loading="eager"
                            decoding="async"
                        />
                    </div>
                    <div className="absolute inset-0 left-1/2 -translate-x-1/2 w-screen bg-gradient-to-t from-background via-background/60 to-transparent -mt-6" />
                    <div className="absolute inset-0 left-1/2 -translate-x-1/2 w-screen bg-gradient-to-r from-background/80 via-transparent to-background/80 -mt-6" />
                </>
            ) : headshotUrl ? (
                <>
                    <div className="absolute inset-0 left-1/2 -translate-x-1/2 w-screen overflow-hidden -mt-6">
                        <img
                            src={headshotUrl}
                            alt=""
                            className="w-full h-full object-cover opacity-30 blur-2xl scale-110"
                            loading="eager"
                            decoding="async"
                        />
                    </div>
                    <div className="absolute inset-0 left-1/2 -translate-x-1/2 w-screen bg-gradient-to-t from-background via-background/70 to-background/40 -mt-6" />
                    <div className="absolute inset-0 left-1/2 -translate-x-1/2 w-screen bg-gradient-to-r from-background/70 via-transparent to-background/70 -mt-6" />
                </>
            ) : null}

            {/* Content */}
            <div className={fanartUrl || headshotUrl ? "relative pt-[12vh] sm:pt-[20vh] md:pt-[30vh] pb-8" : "pb-8"}>
                <div className="grid md:grid-cols-[180px_1fr] lg:grid-cols-[240px_1fr] gap-6 md:gap-8">
                    {/* Headshot Column */}
                    <div className="space-y-4">
                        <div className="max-md:max-w-[45vw] aspect-2/3 overflow-hidden rounded-sm bg-muted/50">
                            {headshotUrl ? (
                                <img
                                    src={headshotUrl}
                                    alt={person.name}
                                    className="w-full h-full object-cover"
                                    loading="eager"
                                    decoding="async"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-muted/30">
                                    <User className="size-16 text-muted-foreground/50" />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Info Column */}
                    <div className="space-y-6">
                        {/* Name & Department */}
                        <div className="space-y-3">
                            <div className="text-xs tracking-widest uppercase text-muted-foreground">
                                {person.known_for_department || "Person"}
                            </div>
                            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-light leading-tight">{person.name}</h1>
                        </div>

                        {/* Metadata Line */}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                            {person.birthday && (
                                <span className="flex items-center gap-1.5">
                                    <Calendar className="size-4 text-primary/70" />
                                    <span>{formatLocalizedDate(person.birthday)}</span>
                                    {age && !person.death && (
                                        <span className="text-foreground/60">({age} years old)</span>
                                    )}
                                </span>
                            )}
                            {person.birthplace && (
                                <>
                                    <span className="text-border">·</span>
                                    <span className="flex items-center gap-1.5">
                                        <MapPin className="size-4 text-primary/70" />
                                        <span>{person.birthplace}</span>
                                    </span>
                                </>
                            )}
                            {person.death && (
                                <>
                                    <span className="text-border">·</span>
                                    <span className="flex items-center gap-1.5">
                                        <Skull className="size-4 text-muted-foreground/70" />
                                        <span>{formatLocalizedDate(person.death)}</span>
                                        {age && <span className="text-foreground/60">(aged {age})</span>}
                                    </span>
                                </>
                            )}
                        </div>

                        {/* Biography */}
                        {person.biography && (
                            <div className="space-y-2">
                                <p className="text-sm sm:text-base text-foreground/80 leading-relaxed max-w-2xl whitespace-pre-line">
                                    {displayBio}
                                    {shouldTruncate && !bioExpanded && "..."}
                                </p>
                                {shouldTruncate && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setBioExpanded(!bioExpanded)}
                                        className="text-muted-foreground hover:text-foreground -ml-2">
                                        {bioExpanded ? (
                                            <>
                                                Show less <ChevronUp className="size-4 ml-1" />
                                            </>
                                        ) : (
                                            <>
                                                Read more <ChevronDown className="size-4 ml-1" />
                                            </>
                                        )}
                                    </Button>
                                )}
                            </div>
                        )}

                        {/* External Links */}
                        <div className="flex flex-wrap items-center gap-5 pt-2">
                            {person.ids?.imdb && (
                                <Link
                                    href={`https://www.imdb.com/name/${person.ids.imdb}`}
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
                            {person.ids?.tmdb && (
                                <Link
                                    href={`https://www.themoviedb.org/person/${person.ids.tmdb}`}
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
                            {person.ids?.trakt && (
                                <Link
                                    href={`https://trakt.tv/people/${person.ids.slug || person.ids.trakt}`}
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
                            {person.social_ids?.twitter && (
                                <Link
                                    href={`https://twitter.com/${person.social_ids.twitter}`}
                                    target="_blank"
                                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                                    <img
                                        src="https://cdn.jsdelivr.net/npm/simple-icons@v14/icons/x.svg"
                                        alt=""
                                        className="size-4 opacity-60 dark:invert"
                                    />
                                    Twitter
                                </Link>
                            )}
                            {person.social_ids?.instagram && (
                                <Link
                                    href={`https://instagram.com/${person.social_ids.instagram}`}
                                    target="_blank"
                                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                                    <img
                                        src="https://cdn.jsdelivr.net/npm/simple-icons@v14/icons/instagram.svg"
                                        alt=""
                                        className="size-4 opacity-60 dark:invert"
                                    />
                                    Instagram
                                </Link>
                            )}
                            {person.social_ids?.facebook && (
                                <Link
                                    href={`https://facebook.com/${person.social_ids.facebook}`}
                                    target="_blank"
                                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                                    <img
                                        src="https://cdn.jsdelivr.net/npm/simple-icons@v14/icons/facebook.svg"
                                        alt=""
                                        className="size-4 opacity-60 dark:invert"
                                    />
                                    Facebook
                                </Link>
                            )}
                            {person.social_ids?.wikipedia && (
                                <Link
                                    href={`https://en.wikipedia.org/wiki/${person.social_ids.wikipedia}`}
                                    target="_blank"
                                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                                    <img
                                        src="https://cdn.jsdelivr.net/npm/simple-icons@v14/icons/wikipedia.svg"
                                        alt=""
                                        className="size-4 opacity-60 dark:invert"
                                    />
                                    Wikipedia
                                </Link>
                            )}
                            {person.homepage && (
                                <Link
                                    href={person.homepage}
                                    target="_blank"
                                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                                    <span className="size-4 flex items-center justify-center text-xs">🌐</span>
                                    Website
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
});

// Credit Card Component - reuses MediaCard pattern
const CreditCard = memo(function CreditCard({
    media,
    type,
    role,
    episodeCount,
}: {
    media: TraktMedia;
    type: "movie" | "show";
    role?: string;
    episodeCount?: number;
}) {
    const slug = media.ids?.slug || media.ids?.imdb;
    const linkHref = slug ? `/${type}s/${slug}` : "#";
    const posterUrl =
        getPosterUrl(media.images) ||
        `https://placehold.co/300x450/1a1a1a/3e3e3e?text=${encodeURIComponent(media.title)}`;

    return (
        <Link href={linkHref} className="block group">
            <div className="relative overflow-hidden transition-transform duration-300 ease-out hover:scale-hover [content-visibility:auto] [contain-intrinsic-size:120px_180px]">
                <div className="aspect-2/3 relative overflow-hidden bg-muted/50 rounded-sm">
                    <Image
                        src={posterUrl}
                        alt={media.title}
                        fill
                        sizes="(max-width: 640px) 120px, (max-width: 768px) 150px, 180px"
                        className="object-cover transition-opacity duration-300"
                        loading="lazy"
                        unoptimized
                    />

                    {/* Type badge */}
                    <span className="absolute top-0 left-0 z-10 text-[10px] font-medium tracking-widest uppercase text-primary bg-black/50 backdrop-blur-md px-2 py-1 rounded-br-sm rounded-tl-sm">
                        {type === "movie" ? "Film" : "Series"}
                    </span>

                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                    {/* Content on hover */}
                    <div className="absolute inset-x-0 bottom-0 p-3 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                        <h3 className="font-medium text-sm text-white leading-tight line-clamp-2 mb-1.5">
                            {media.title}
                        </h3>

                        <div className="flex items-center gap-2 text-xs text-white/70">
                            {media.year && <span>{media.year}</span>}
                            {media.rating && (
                                <>
                                    <span className="text-white/30">·</span>
                                    <span className="flex items-center gap-1">
                                        <Star className="size-3.5 fill-[#F5C518] text-[#F5C518]" />
                                        {media.rating.toFixed(1)}
                                    </span>
                                </>
                            )}
                        </div>

                        {role && <p className="text-xs text-white/60 mt-1 line-clamp-1">{role}</p>}
                        {episodeCount && (
                            <p className="text-xs text-white/50 mt-0.5">
                                {episodeCount} episode{episodeCount !== 1 ? "s" : ""}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </Link>
    );
});

// Credits Grid Component
const CreditsGrid = memo(function CreditsGrid({
    credits,
    isLoading,
}: {
    credits: Array<{
        media: TraktMedia;
        type: "movie" | "show";
        role?: string;
        year?: number;
        episodeCount?: number;
    }>;
    isLoading: boolean;
}) {
    if (isLoading) {
        return (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3 sm:gap-4">
                {Array.from({ length: 14 }).map((_, i) => (
                    <Skeleton key={i} className="aspect-2/3 rounded-sm" />
                ))}
            </div>
        );
    }

    if (credits.length === 0) {
        return <p className="text-sm text-muted-foreground py-8 text-center">No credits found</p>;
    }

    return (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3 sm:gap-4">
            {credits.map((credit, index) => (
                <CreditCard
                    key={`${credit.type}-${credit.media.ids?.trakt || index}`}
                    media={credit.media}
                    type={credit.type}
                    role={credit.role}
                    episodeCount={credit.episodeCount}
                />
            ))}
        </div>
    );
});

// Filmography Tabs Component
const FilmographyTabs = memo(function FilmographyTabs({ slug }: { slug: string }) {
    const { data: movieCredits, isLoading: moviesLoading } = useTraktPersonMovies(slug);
    const { data: showCredits, isLoading: showsLoading } = useTraktPersonShows(slug);

    const isLoading = moviesLoading || showsLoading;

    // Process and organize credits by department
    const organizedCredits = useMemo(() => {
        const acting: Array<{
            media: TraktMedia;
            type: "movie" | "show";
            role?: string;
            year?: number;
            episodeCount?: number;
        }> = [];
        const directing: typeof acting = [];
        const writing: typeof acting = [];
        const production: typeof acting = [];
        const crew: typeof acting = [];

        // Process movie cast
        movieCredits?.cast?.forEach((credit) => {
            acting.push({
                media: credit.movie,
                type: "movie",
                role: credit.characters?.join(", "),
                year: credit.movie.year,
            });
        });

        // Process show cast
        showCredits?.cast?.forEach((credit) => {
            acting.push({
                media: credit.show,
                type: "show",
                role: credit.characters?.join(", "),
                year: credit.show.year,
                episodeCount: credit.episode_count,
            });
        });

        // Process movie crew
        const processMovieCrew = (crewList: TraktPersonMovieCredit[] | undefined, target: typeof acting) => {
            crewList?.forEach((credit) => {
                target.push({
                    media: credit.movie,
                    type: "movie",
                    role: credit.jobs?.join(", "),
                    year: credit.movie.year,
                });
            });
        };

        // Process show crew
        const processShowCrew = (crewList: TraktPersonShowCredit[] | undefined, target: typeof acting) => {
            crewList?.forEach((credit) => {
                target.push({
                    media: credit.show,
                    type: "show",
                    role: credit.jobs?.join(", "),
                    year: credit.show.year,
                    episodeCount: credit.episode_count,
                });
            });
        };

        // Directing
        processMovieCrew(movieCredits?.crew?.directing, directing);
        processShowCrew(showCredits?.crew?.directing, directing);

        // Writing
        processMovieCrew(movieCredits?.crew?.writing, writing);
        processShowCrew(showCredits?.crew?.writing, writing);

        // Production
        processMovieCrew(movieCredits?.crew?.production, production);
        processShowCrew(showCredits?.crew?.production, production);

        // Other crew (art, sound, camera, etc.)
        const otherCrewDepts = [
            "art",
            "sound",
            "camera",
            "editing",
            "visual effects",
            "costume & make-up",
            "crew",
        ] as const;
        otherCrewDepts.forEach((dept) => {
            processMovieCrew(
                movieCredits?.crew?.[dept as keyof typeof movieCredits.crew] as TraktPersonMovieCredit[] | undefined,
                crew
            );
            processShowCrew(
                showCredits?.crew?.[dept as keyof typeof showCredits.crew] as TraktPersonShowCredit[] | undefined,
                crew
            );
        });

        // Created by (shows only)
        processShowCrew(showCredits?.crew?.["created by"], production);

        // Sort all by year (newest first), dedupe by trakt id
        const sortAndDedupe = (arr: typeof acting) => {
            const seen = new Set<number>();
            return arr
                .filter((item) => {
                    const id = item.media.ids?.trakt;
                    if (!id || seen.has(id)) return false;
                    seen.add(id);
                    return true;
                })
                .sort((a, b) => (b.year || 0) - (a.year || 0));
        };

        return {
            acting: sortAndDedupe(acting),
            directing: sortAndDedupe(directing),
            writing: sortAndDedupe(writing),
            production: sortAndDedupe(production),
            crew: sortAndDedupe(crew),
        };
    }, [movieCredits, showCredits]);

    // Determine available tabs
    const availableTabs = useMemo(() => {
        const tabs: Array<{ id: string; label: string; count: number }> = [];
        if (organizedCredits.acting.length > 0) {
            tabs.push({ id: "acting", label: "Acting", count: organizedCredits.acting.length });
        }
        if (organizedCredits.directing.length > 0) {
            tabs.push({ id: "directing", label: "Directing", count: organizedCredits.directing.length });
        }
        if (organizedCredits.writing.length > 0) {
            tabs.push({ id: "writing", label: "Writing", count: organizedCredits.writing.length });
        }
        if (organizedCredits.production.length > 0) {
            tabs.push({ id: "production", label: "Production", count: organizedCredits.production.length });
        }
        if (organizedCredits.crew.length > 0) {
            tabs.push({ id: "crew", label: "Crew", count: organizedCredits.crew.length });
        }
        return tabs;
    }, [organizedCredits]);

    const defaultTab = availableTabs[0]?.id || "acting";

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <div className="h-px flex-1 bg-border/50" />
                    <span className="text-xs tracking-widest uppercase text-muted-foreground">Filmography</span>
                    <div className="h-px flex-1 bg-border/50" />
                </div>
                <div className="flex gap-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-9 w-24 rounded-md" />
                    ))}
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3 sm:gap-4">
                    {Array.from({ length: 14 }).map((_, i) => (
                        <Skeleton key={i} className="aspect-2/3 rounded-sm" />
                    ))}
                </div>
            </div>
        );
    }

    if (availableTabs.length === 0) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <div className="h-px flex-1 bg-border/50" />
                    <span className="text-xs tracking-widest uppercase text-muted-foreground">Filmography</span>
                    <div className="h-px flex-1 bg-border/50" />
                </div>
                <p className="text-sm text-muted-foreground py-8 text-center">No filmography available</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <div className="h-px flex-1 bg-border/50" />
                <span className="text-xs tracking-widest uppercase text-muted-foreground">Filmography</span>
                <div className="h-px flex-1 bg-border/50" />
            </div>

            <Tabs defaultValue={defaultTab} className="w-full">
                <div className="-mx-4 px-4 overflow-x-auto scrollbar-none md:mx-0 md:px-0 md:overflow-visible">
                    <TabsList variant="line" className="mb-6 w-max md:w-auto">
                        {availableTabs.map((tab) => (
                            <TabsTrigger key={tab.id} value={tab.id} className="gap-2 whitespace-nowrap">
                                {tab.label}
                                <span className="text-xs text-muted-foreground/70 tabular-nums">{tab.count}</span>
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </div>

                <TabsContent value="acting">
                    <CreditsGrid credits={organizedCredits.acting} isLoading={false} />
                </TabsContent>
                <TabsContent value="directing">
                    <CreditsGrid credits={organizedCredits.directing} isLoading={false} />
                </TabsContent>
                <TabsContent value="writing">
                    <CreditsGrid credits={organizedCredits.writing} isLoading={false} />
                </TabsContent>
                <TabsContent value="production">
                    <CreditsGrid credits={organizedCredits.production} isLoading={false} />
                </TabsContent>
                <TabsContent value="crew">
                    <CreditsGrid credits={organizedCredits.crew} isLoading={false} />
                </TabsContent>
            </Tabs>
        </div>
    );
});

// Main Page Component
const PersonPage = memo(function PersonPage() {
    const params = useParams();
    const slug = params.slug as string;

    const { data: person, isLoading, error } = useTraktPerson(slug);

    if (error) {
        return (
            <div className="w-full lg:px-6 max-w-6xl mx-auto">
                <div className="py-20 text-center">
                    <h1 className="text-2xl font-light text-muted-foreground">Person not found</h1>
                    <p className="text-sm text-muted-foreground/60 mt-2">
                        The person you&apos;re looking for doesn&apos;t exist or has been removed.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full lg:px-6 max-w-6xl mx-auto">
            <PersonHeader person={person} isLoading={isLoading} />

            <div className="mt-8">
                <FilmographyTabs slug={slug} />
            </div>

            <MdbFooter className="py-12 mt-8 border-t border-border/50" />
        </div>
    );
});

export default PersonPage;
