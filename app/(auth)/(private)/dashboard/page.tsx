"use client";

import dynamic from "next/dynamic";
import { MediaSection } from "@/components/mdb/media-section";
import { SearchDialog } from "@/components/mdb/search-dialog";
import { MdbFooter } from "@/components/mdb/mdb-footer";
import { memo, useState } from "react";
import {
    useTraktTrendingMovies,
    useTraktTrendingShows,
    useTraktPopularMovies,
    useTraktPopularShows,
    useTraktMostWatchedMovies,
    useTraktMostWatchedShows,
    useTraktAnticipatedMovies,
    useTraktAnticipatedShows,
    useTraktBoxOfficeMovies,
    useTraktMostPlayedMovies,
    useTraktMostPlayedShows,
} from "@/hooks/use-trakt";
import { CommandIcon, Search, Bug } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DISCORD_URL } from "@/lib/constants";
import Image from "next/image";

// Dynamic import for HeroCarousel to reduce initial bundle size (~315 lines)
const HeroCarousel = dynamic(
    () => import("@/components/mdb/hero-carousel").then((m) => ({ default: m.HeroCarousel })),
    {
        loading: () => (
            <div className="-mx-4 -mt-6">
                <div className="relative w-full">
                    <div className="w-full aspect-10/16 md:aspect-video animate-pulse bg-muted" />
                </div>
            </div>
        ),
    }
);

const DashboardPage = memo(function DashboardPage() {
    const [searchOpen, setSearchOpen] = useState(false);

    const trendingMovies = useTraktTrendingMovies(20);
    const trendingShows = useTraktTrendingShows(20);
    const popularMovies = useTraktPopularMovies(20);
    const popularShows = useTraktPopularShows(20);
    const mostWatchedMovies = useTraktMostWatchedMovies("weekly", 20);
    const mostWatchedShows = useTraktMostWatchedShows("weekly", 20);
    const anticipatedMovies = useTraktAnticipatedMovies(20);
    const anticipatedShows = useTraktAnticipatedShows(20);
    const boxOffice = useTraktBoxOfficeMovies();
    const mostPlayedMovies = useTraktMostPlayedMovies("weekly", 20);
    const mostPlayedShows = useTraktMostPlayedShows("weekly", 20);

    return (
        <div className="space-y-4 sm:space-y-6 lg:space-y-8 pb-4 sm:pb-8">
            {/* Full-width Hero Carousel */}
            <HeroCarousel />

            {/* Branding CTA */}
            <div className="py-4 md:py-6 px-4">
                <div className="max-w-2xl mx-auto text-center space-y-3">
                    <a
                        href="https://github.com/viperadnan-git/debridui"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block">
                        <Image
                            src="/logo.svg"
                            alt="DebridUI"
                            width={180}
                            height={42}
                            className="dark:invert opacity-80 hover:opacity-100 transition-all hover:scale-105 md:w-[220px]"
                        />
                    </a>
                    <p className="text-muted-foreground text-sm md:text-base max-w-md mx-auto">
                        A modern, fast debrid client with integrated media discovery and streaming capabilities.
                    </p>
                    <div className="flex items-center justify-center gap-3 flex-wrap">
                        {DISCORD_URL && (
                            <Button
                                variant="outline"
                                className="gap-2 bg-[#5865F2]/10 hover:bg-[#5865F2]/20 text-[#5865F2] border-[#5865F2]/30 hover:border-[#5865F2]/50"
                                asChild>
                                <a href={DISCORD_URL} target="_blank" rel="noopener noreferrer">
                                    <img
                                        src="https://cdn.simpleicons.org/discord/5865F2"
                                        alt="Discord"
                                        className="size-4"
                                    />
                                    Join Community
                                </a>
                            </Button>
                        )}
                        <Button variant="outline" className="gap-2" asChild>
                            <a
                                href="https://github.com/viperadnan-git/debridui/issues"
                                target="_blank"
                                rel="noopener noreferrer">
                                <Bug className="size-4" />
                                Report Bug
                            </a>
                        </Button>
                    </div>
                </div>
            </div>

            {/* Search Bar */}
            <div className="py-6 md:px-4 mb-4">
                <Button
                    variant="outline"
                    onClick={() => setSearchOpen(true)}
                    className="w-full max-w-lg mx-auto flex items-center justify-start gap-3 h-12 text-muted-foreground bg-background/50 hover:bg-background/80 hover:text-foreground border-border/50">
                    <Search className="h-4 w-4" />
                    <span>Search movies and TV shows...</span>
                    <div className="ml-auto flex items-center gap-1">
                        <kbd className="pointer-events-none inline-flex h-6 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                            <CommandIcon className="size-3" />
                            <span className="text-sm">K</span>
                        </kbd>
                    </div>
                </Button>
            </div>

            <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />

            {/* Content with padding */}
            <div className="md:px-4 space-y-4 sm:space-y-6 lg:space-y-8">
                <MediaSection
                    title="Trending Movies"
                    items={trendingMovies.data}
                    isLoading={trendingMovies.isLoading}
                    error={trendingMovies.error}
                    showRank={true}
                />

                <MediaSection
                    title="Trending TV Shows"
                    items={trendingShows.data}
                    isLoading={trendingShows.isLoading}
                    error={trendingShows.error}
                    showRank={true}
                />

                <MediaSection
                    title="Box Office"
                    items={boxOffice.data}
                    isLoading={boxOffice.isLoading}
                    error={boxOffice.error}
                />

                <MediaSection
                    title="Popular Movies"
                    items={popularMovies.data}
                    isLoading={popularMovies.isLoading}
                    error={popularMovies.error}
                />

                <MediaSection
                    title="Popular TV Shows"
                    items={popularShows.data}
                    isLoading={popularShows.isLoading}
                    error={popularShows.error}
                />

                <MediaSection
                    title="Most Watched Movies This Week"
                    items={mostWatchedMovies.data}
                    isLoading={mostWatchedMovies.isLoading}
                    error={mostWatchedMovies.error}
                />

                <MediaSection
                    title="Most Watched TV Shows This Week"
                    items={mostWatchedShows.data}
                    isLoading={mostWatchedShows.isLoading}
                    error={mostWatchedShows.error}
                />

                <MediaSection
                    title="Most Played Movies This Week"
                    items={mostPlayedMovies.data}
                    isLoading={mostPlayedMovies.isLoading}
                    error={mostPlayedMovies.error}
                />

                <MediaSection
                    title="Most Played TV Shows This Week"
                    items={mostPlayedShows.data}
                    isLoading={mostPlayedShows.isLoading}
                    error={mostPlayedShows.error}
                />

                <MediaSection
                    title="Anticipated Movies"
                    items={anticipatedMovies.data}
                    isLoading={anticipatedMovies.isLoading}
                    error={anticipatedMovies.error}
                />

                <MediaSection
                    title="Anticipated TV Shows"
                    items={anticipatedShows.data}
                    isLoading={anticipatedShows.isLoading}
                    error={anticipatedShows.error}
                />

<MdbFooter className="py-8" />
            </div>
        </div>
    );
});

export default DashboardPage;
