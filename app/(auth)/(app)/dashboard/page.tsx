"use client";

import dynamic from "next/dynamic";
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
import { MediaSection } from "@/components/mdb/media-section";

const HeroCarousel = dynamic(
    () => import("@/components/mdb/hero-carousel").then((m) => ({ default: m.HeroCarousel })),
    {
        loading: () => <HeroCarouselSkeleton />,
        ssr: false,
    }
);

// Welcome hero section with glassmorphic design
const WelcomeSection = memo(function WelcomeSection({ onSearchClick }: { onSearchClick: () => void }) {
    return (
        <section className="relative py-12 lg:py-16 lg:px-6">
            {/* Subtle gradient background */}
            <div className="absolute inset-0 -z-10 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.03] via-transparent to-transparent" />
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/[0.04] rounded-full blur-3xl" />
                <div className="absolute top-0 right-1/4 w-64 h-64 bg-primary/[0.03] rounded-full blur-3xl" />
            </div>

            <div className="max-w-4xl mx-auto">
                {/* Welcome header */}
                <div className="text-center space-y-5 mb-10">
                    <div
                        className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 backdrop-blur-sm"
                        style={{ animationDelay: "100ms" }}>
                        <Sparkles className="size-3.5 text-primary" />
                        <span className="text-xs tracking-widest uppercase text-primary/90">Welcome to DebridUI</span>
                    </div>
                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-light tracking-tight leading-tightest">
                        <span className="bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text">
                            Discover & Stream
                        </span>
                    </h1>
                    <p className="text-xs sm:text-sm text-muted-foreground max-w-xl mx-auto leading-relaxed">
                        A modern debrid client for managing your files, discovering trending movies and shows — with
                        addon support and streaming to your preferred media player.
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

                {/* Action buttons */}
                <div className="flex flex-wrap items-center justify-center gap-3">
                    {DISCORD_URL && (
                        <Button size="sm" className="gap-2 bg-[#5865F2] hover:bg-[#4752C4] text-white h-9" asChild>
                            <a href={DISCORD_URL} target="_blank" rel="noopener noreferrer">
                                <img
                                    src="https://simpleicons.org/icons/discord.svg"
                                    alt=""
                                    className="size-4 invert"
                                    loading="lazy"
                                />
                                <span>Join Discord</span>
                            </a>
                        </Button>
                    )}
                    <Button variant="outline" size="sm" className="gap-2 h-9" asChild>
                        <a href="https://github.com/viperadnan-git/debridui" target="_blank" rel="noopener noreferrer">
                            <img
                                src="https://simpleicons.org/icons/github.svg"
                                alt=""
                                className="size-4 dark:invert"
                                loading="lazy"
                            />
                            <span>Star on GitHub</span>
                        </a>
                    </Button>
                </div>
            </div>
        </section>
    );
});

// Content section with modern divider
interface ContentSectionProps {
    label: string;
    icon?: React.ReactNode;
    children: React.ReactNode;
    delay?: number;
}

const ContentSection = memo(function ContentSection({ label, icon, children, delay = 0 }: ContentSectionProps) {
    return (
        <div
            className="space-y-8 animate-in fade-in-0 slide-in-from-bottom-4"
            style={{
                animationDelay: `${delay}ms`,
                animationDuration: "600ms",
                animationFillMode: "backwards",
            }}>
            {/* Section divider with animated accent */}
            <div className="flex items-center gap-4 py-2">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border/50 to-border/50" />
                <div className="flex items-center gap-2.5 px-4 py-1.5 rounded-full border border-border/50 bg-card/50 backdrop-blur-sm">
                    {icon && <span className="text-primary">{icon}</span>}
                    <span className="text-xs tracking-widest uppercase text-muted-foreground">{label}</span>
                </div>
                <div className="h-px flex-1 bg-gradient-to-l from-transparent via-border/50 to-border/50" />
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
        <div className="pb-12">
            {/* Hero Carousel */}
            <HeroCarousel autoFocus />

            {/* Welcome Section */}
            <WelcomeSection onSearchClick={() => setSearchOpen(true)} />

            <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />

            {/* Content Sections with lazy loading */}
            <div className="lg:px-6 space-y-16">
                {/* Trending */}
                <ContentSection label="Trending Now" icon={<TrendingUp className="size-3.5" />} delay={0}>
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
                <ContentSection label="Popular" icon={<Sparkles className="size-3.5" />} delay={100}>
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
                <ContentSection label="Box Office" icon={<Ticket className="size-3.5" />} delay={200}>
                    <MediaSection
                        title="Top Grossing"
                        items={boxOffice.data}
                        isLoading={boxOffice.isLoading}
                        error={boxOffice.error}
                    />
                </ContentSection>

                {/* Most Watched */}
                <ContentSection label="Most Watched This Week" icon={<Film className="size-3.5" />} delay={300}>
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
                <ContentSection label="Coming Soon" icon={<Calendar className="size-3.5" />} delay={400}>
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

                {/* Footer */}
                <MdbFooter className="pt-10 border-t border-border/50" />
            </div>
        </div>
    );
});

export default DashboardPage;
