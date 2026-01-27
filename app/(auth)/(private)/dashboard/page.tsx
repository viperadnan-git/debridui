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
import { SearchIcon } from "lucide-react";

const HeroCarousel = dynamic(
    () => import("@/components/mdb/hero-carousel").then((m) => ({ default: m.HeroCarousel })),
    {
        loading: () => (
            <div className="-mx-4 -mt-6 lg:-mx-6">
                <div className="relative w-full">
                    <div className="w-full aspect-10/16 md:aspect-video animate-pulse bg-muted/50" />
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
        <div className="pb-8">
            {/* Hero Carousel */}
            <HeroCarousel />

            {/* Search */}
            <div className="py-8 lg:px-6">
                <button
                    onClick={() => setSearchOpen(true)}
                    className="w-full max-w-xl mx-auto flex items-center gap-3 h-12 px-4 text-sm text-muted-foreground bg-muted/30 hover:bg-muted/50 border border-border/50 rounded-sm transition-colors">
                    <SearchIcon className="size-4" />
                    <span>Search movies and shows...</span>
                    <kbd className="ml-auto hidden sm:inline-flex h-5 items-center gap-0.5 rounded border border-border/50 bg-muted/50 px-1.5 font-mono text-xs text-muted-foreground">
                        <span className="text-xs">⌘</span>K
                    </kbd>
                </button>
            </div>

            <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />

            {/* Content Sections */}
            <div className="lg:px-6 space-y-12">
                {/* Trending */}
                <div className="space-y-8">
                    <div className="flex items-center gap-4">
                        <div className="h-px flex-1 bg-border/50" />
                        <span className="text-xs tracking-widest uppercase text-muted-foreground">Trending Now</span>
                        <div className="h-px flex-1 bg-border/50" />
                    </div>

                    <MediaSection
                        title="Movies"
                        items={trendingMovies.data}
                        isLoading={trendingMovies.isLoading}
                        error={trendingMovies.error}
                        showRank={true}
                    />

                    <MediaSection
                        title="TV Shows"
                        items={trendingShows.data}
                        isLoading={trendingShows.isLoading}
                        error={trendingShows.error}
                        showRank={true}
                    />
                </div>

                {/* Popular */}
                <div className="space-y-8">
                    <div className="flex items-center gap-4">
                        <div className="h-px flex-1 bg-border/50" />
                        <span className="text-xs tracking-widest uppercase text-muted-foreground">Popular</span>
                        <div className="h-px flex-1 bg-border/50" />
                    </div>

                    <MediaSection
                        title="Movies"
                        items={popularMovies.data}
                        isLoading={popularMovies.isLoading}
                        error={popularMovies.error}
                    />

                    <MediaSection
                        title="TV Shows"
                        items={popularShows.data}
                        isLoading={popularShows.isLoading}
                        error={popularShows.error}
                    />
                </div>

                {/* Box Office */}
                <div className="space-y-8">
                    <div className="flex items-center gap-4">
                        <div className="h-px flex-1 bg-border/50" />
                        <span className="text-xs tracking-widest uppercase text-muted-foreground">Box Office</span>
                        <div className="h-px flex-1 bg-border/50" />
                    </div>

                    <MediaSection
                        title="Top Grossing"
                        items={boxOffice.data}
                        isLoading={boxOffice.isLoading}
                        error={boxOffice.error}
                    />
                </div>

                {/* Most Watched */}
                <div className="space-y-8">
                    <div className="flex items-center gap-4">
                        <div className="h-px flex-1 bg-border/50" />
                        <span className="text-xs tracking-widest uppercase text-muted-foreground">
                            Most Watched This Week
                        </span>
                        <div className="h-px flex-1 bg-border/50" />
                    </div>

                    <MediaSection
                        title="Movies"
                        items={mostWatchedMovies.data}
                        isLoading={mostWatchedMovies.isLoading}
                        error={mostWatchedMovies.error}
                    />

                    <MediaSection
                        title="TV Shows"
                        items={mostWatchedShows.data}
                        isLoading={mostWatchedShows.isLoading}
                        error={mostWatchedShows.error}
                    />
                </div>

                {/* Most Played */}
                <div className="space-y-8">
                    <div className="flex items-center gap-4">
                        <div className="h-px flex-1 bg-border/50" />
                        <span className="text-xs tracking-widest uppercase text-muted-foreground">
                            Most Played This Week
                        </span>
                        <div className="h-px flex-1 bg-border/50" />
                    </div>

                    <MediaSection
                        title="Movies"
                        items={mostPlayedMovies.data}
                        isLoading={mostPlayedMovies.isLoading}
                        error={mostPlayedMovies.error}
                    />

                    <MediaSection
                        title="TV Shows"
                        items={mostPlayedShows.data}
                        isLoading={mostPlayedShows.isLoading}
                        error={mostPlayedShows.error}
                    />
                </div>

                {/* Coming Soon */}
                <div className="space-y-8">
                    <div className="flex items-center gap-4">
                        <div className="h-px flex-1 bg-border/50" />
                        <span className="text-xs tracking-widest uppercase text-muted-foreground">Coming Soon</span>
                        <div className="h-px flex-1 bg-border/50" />
                    </div>

                    <MediaSection
                        title="Movies"
                        items={anticipatedMovies.data}
                        isLoading={anticipatedMovies.isLoading}
                        error={anticipatedMovies.error}
                    />

                    <MediaSection
                        title="TV Shows"
                        items={anticipatedShows.data}
                        isLoading={anticipatedShows.isLoading}
                        error={anticipatedShows.error}
                    />
                </div>

                <MdbFooter className="pt-8 border-t border-border/50" />
            </div>
        </div>
    );
});

export default DashboardPage;
