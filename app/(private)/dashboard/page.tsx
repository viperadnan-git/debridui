"use client";

import { HeroCarousel } from "@/components/mdb/hero-carousel";
import { MediaSection } from "@/components/mdb/media-section";
import { SearchDialog } from "@/components/mdb/search-dialog";
import { memo, useState } from "react";
import {
    useTraktTrendingMixed,
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
import { CommandIcon, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

const DashboardPage = memo(function DashboardPage() {
    const [searchOpen, setSearchOpen] = useState(false);

    const trendingMixed = useTraktTrendingMixed(10);
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
            <HeroCarousel
                items={trendingMixed.data.mixed}
                isLoading={trendingMixed.isLoading}
            />

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
            </div>
        </div>
    );
});

export default DashboardPage;
