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
} from "@/hooks/use-trakt";
import { SearchIcon, Sparkles, Film, TrendingUp, Calendar, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DISCORD_URL } from "@/lib/constants";
import { HeroCarouselSkeleton } from "@/components/mdb/hero-carousel-skeleton";

const HeroCarousel = dynamic(
    () => import("@/components/mdb/hero-carousel").then((m) => ({ default: m.HeroCarousel })),
    {
        loading: () => <HeroCarouselSkeleton />,
        ssr: false,
    }
);

const WelcomeSection = memo(function WelcomeSection({ onSearchClick }: { onSearchClick: () => void }) {
    return (
        <div className="py-10 lg:px-6">
            <div className="max-w-4xl mx-auto">
                {/* Welcome header */}
                <div className="text-center space-y-4 mb-8">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs tracking-wider uppercase">
                        <Sparkles className="size-3.5" />
                        <span>Welcome to DebridUI</span>
                    </div>
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-light tracking-tight">Discover & Stream</h1>
                    <p className="text-muted-foreground max-w-lg mx-auto leading-relaxed">
                        A modern interface for discovering and streaming media through your debrid services. Browse
                        trending content, manage your files, and enjoy seamless playback.
                    </p>
                </div>

                {/* Search bar */}
                <div className="max-w-xl mx-auto mb-8">
                    <button
                        onClick={onSearchClick}
                        className="w-full flex items-center gap-3 h-12 px-4 text-sm text-muted-foreground bg-muted/30 hover:bg-muted/50 border border-border/50 rounded-sm transition-all duration-200 hover:border-border group">
                        <SearchIcon className="size-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                        <span className="flex-1 text-left">Search movies, shows, files...</span>
                        <kbd className="hidden sm:inline-flex h-6 items-center gap-1 rounded border border-border/50 bg-muted/50 px-2 font-mono text-xs text-muted-foreground">
                            <span>⌘</span>
                            <span>K</span>
                        </kbd>
                    </button>
                </div>

                {/* Quick stats / Links */}
                <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
                    {DISCORD_URL && (
                        <Button size="sm" className="gap-2 bg-[#5865F2] hover:bg-[#4752C4] text-white h-9" asChild>
                            <a href={DISCORD_URL} target="_blank" rel="noopener noreferrer">
                                <img src="https://simpleicons.org/icons/discord.svg" alt="" className="size-4 invert" />
                                <span>Join Discord</span>
                            </a>
                        </Button>
                    )}
                    <Button variant="outline" size="sm" className="gap-2 h-9" asChild>
                        <a href="https://github.com/viperadnan-git/debridui" target="_blank" rel="noopener noreferrer">
                            <img src="https://simpleicons.org/icons/github.svg" alt="" className="size-4 dark:invert" />
                            <span>GitHub</span>
                        </a>
                    </Button>
                </div>
            </div>
        </div>
    );
});

interface ContentSectionProps {
    label: string;
    icon?: React.ReactNode;
    children: React.ReactNode;
}

const ContentSection = memo(function ContentSection({ label, icon, children }: ContentSectionProps) {
    return (
        <div className="space-y-8">
            <div className="flex items-center gap-4 py-2">
                <div className="h-px flex-1 bg-border/50" />
                <div className="flex items-center gap-2 text-xs tracking-widest uppercase text-muted-foreground">
                    {icon && <span className="text-primary">{icon}</span>}
                    <span>{label}</span>
                </div>
                <div className="h-px flex-1 bg-border/50" />
            </div>
            {children}
        </div>
    );
});

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

    return (
        <div className="pb-8">
            {/* Hero Carousel */}
            <HeroCarousel autoFocus />

            {/* Welcome Section */}
            <WelcomeSection onSearchClick={() => setSearchOpen(true)} />

            <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />

            {/* Content Sections */}
            <div className="lg:px-6 space-y-14">
                {/* Trending */}
                <ContentSection label="Trending Now" icon={<TrendingUp className="size-3.5" />}>
                    <MediaSection
                        title="Movies"
                        items={trendingMovies.data}
                        isLoading={trendingMovies.isLoading}
                        error={trendingMovies.error}
                        showRank
                    />
                    <MediaSection
                        title="TV Shows"
                        items={trendingShows.data}
                        isLoading={trendingShows.isLoading}
                        error={trendingShows.error}
                        showRank
                    />
                </ContentSection>

                {/* Popular */}
                <ContentSection label="Popular" icon={<Sparkles className="size-3.5" />}>
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
                </ContentSection>

                {/* Box Office */}
                <ContentSection label="Box Office" icon={<Ticket className="size-3.5" />}>
                    <MediaSection
                        title="Top Grossing"
                        items={boxOffice.data}
                        isLoading={boxOffice.isLoading}
                        error={boxOffice.error}
                    />
                </ContentSection>

                {/* Most Watched */}
                <ContentSection label="Most Watched This Week" icon={<Film className="size-3.5" />}>
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
                </ContentSection>

                {/* Coming Soon */}
                <ContentSection label="Coming Soon" icon={<Calendar className="size-3.5" />}>
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
                </ContentSection>

                <MdbFooter className="pt-8 border-t border-border/50" />
            </div>
        </div>
    );
});

export default DashboardPage;
