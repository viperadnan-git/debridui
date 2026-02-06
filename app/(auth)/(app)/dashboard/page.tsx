"use client";

import dynamic from "next/dynamic";
import { SearchDialog } from "@/components/mdb/search-dialog";
import { MdbFooter } from "@/components/mdb/mdb-footer";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { SearchIcon, Sparkles, Film, Tv, TrendingUp, Calendar, Ticket, Puzzle } from "lucide-react";
import { DISCORD_URL } from "@/lib/constants";
import { HeroCarouselSkeleton } from "@/components/mdb/hero-carousel-skeleton";
import { MediaSection } from "@/components/mdb/media-section";
import { useAddonCatalogDefs, useAddonCatalog, catalogSlug, type AddonCatalogDef } from "@/hooks/use-addons";

const HeroCarousel = dynamic(
    () => import("@/components/mdb/hero-carousel").then((m) => ({ default: m.HeroCarousel })),
    {
        loading: () => <HeroCarouselSkeleton />,
        ssr: false,
    }
);

// Welcome hero section with editorial minimalism
const WelcomeSection = memo(function WelcomeSection({ onSearchClick }: { onSearchClick: () => void }) {
    return (
        <section className="relative py-12 lg:py-20 lg:px-6">
            <div className="max-w-5xl mx-auto space-y-8">
                {/* Top row: Editorial label + social links */}
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="h-px w-8 bg-primary" />
                        <span className="text-xs tracking-widest uppercase text-muted-foreground">
                            Welcome to DebridUI
                        </span>
                    </div>
                    <div
                        className="flex items-center gap-1 animate-in fade-in-0"
                        style={{ animationDuration: "600ms", animationDelay: "400ms", animationFillMode: "backwards" }}>
                        {DISCORD_URL && (
                            <a
                                href={DISCORD_URL}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="Discord"
                                className="group size-8 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors duration-300">
                                <img
                                    src="https://simpleicons.org/icons/discord.svg"
                                    alt=""
                                    className="size-4 opacity-50 dark:invert group-hover:opacity-100 transition-opacity duration-300"
                                    loading="lazy"
                                />
                            </a>
                        )}
                        <a
                            href="https://github.com/viperadnan-git/debridui"
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="GitHub"
                            className="group size-8 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors duration-300">
                            <img
                                src="https://simpleicons.org/icons/github.svg"
                                alt=""
                                className="size-4 opacity-50 dark:invert group-hover:opacity-100 transition-opacity duration-300"
                                loading="lazy"
                            />
                        </a>
                    </div>
                </div>

                {/* Headline with staggered animation */}
                <div className="space-y-2">
                    <h1
                        className="text-4xl sm:text-5xl lg:text-6xl font-light tracking-tight animate-in fade-in-0 slide-in-from-bottom-4"
                        style={{ animationDuration: "600ms" }}>
                        Discover
                    </h1>
                    <h1
                        className="text-4xl sm:text-5xl lg:text-6xl font-light tracking-tight text-muted-foreground animate-in fade-in-0 slide-in-from-bottom-4"
                        style={{ animationDuration: "600ms", animationDelay: "100ms", animationFillMode: "backwards" }}>
                        & Stream
                    </h1>
                </div>

                {/* Description */}
                <p
                    className="text-sm text-muted-foreground max-w-md leading-relaxed animate-in fade-in-0"
                    style={{ animationDuration: "600ms", animationDelay: "200ms", animationFillMode: "backwards" }}>
                    A modern debrid client for managing your files, discovering trending movies and shows — with addon
                    support and streaming to your preferred media player.
                </p>

                {/* Search bar */}
                <div
                    className="max-w-md animate-in fade-in-0 slide-in-from-bottom-2"
                    style={{ animationDuration: "600ms", animationDelay: "300ms", animationFillMode: "backwards" }}>
                    <button
                        onClick={onSearchClick}
                        className="group w-full flex items-center gap-3 h-11 px-4 text-sm text-muted-foreground bg-transparent hover:bg-muted/30 border border-border/50 hover:border-border rounded-sm transition-all duration-300">
                        <SearchIcon className="size-4 text-muted-foreground/60 group-hover:text-foreground transition-colors duration-300" />
                        <span className="flex-1 text-left">Search movies, shows, files...</span>
                        <kbd className="hidden sm:inline-flex h-6 items-center gap-1 rounded-sm border border-border/50 bg-muted/30 px-2 font-mono text-xs text-muted-foreground">
                            ⌘K
                        </kbd>
                    </button>
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

// Individual catalog row — receives visibility from parent observer
const AddonCatalogRow = memo(function AddonCatalogRow({
    catalog,
    isVisible,
}: {
    catalog: AddonCatalogDef;
    isVisible: boolean;
}) {
    const { data, error } = useAddonCatalog(catalog, isVisible);
    // rerender-memo: stable sliced ref so MediaSection memo is effective
    const items = useMemo(() => data?.items.slice(0, 10), [data]);

    return (
        <MediaSection
            title={catalog.name}
            titleIcon={catalog.type === "movie" ? Film : Tv}
            items={items}
            isLoading={isVisible && !data && !error}
            error={error}
            rows={1}
            viewAllHref={`/discover/addon/${catalogSlug(catalog)}`}
        />
    );
});

// Single shared IntersectionObserver for all catalog rows
const AddonCatalogs = memo(function AddonCatalogs() {
    const { catalogs, isLoading } = useAddonCatalogDefs();
    const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
    const observerRef = useRef<IntersectionObserver>(undefined);
    const pendingRef = useRef<Element[]>([]);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                const newKeys: string[] = [];
                for (const entry of entries) {
                    if (entry.isIntersecting) {
                        const key = (entry.target as HTMLElement).dataset.catalogKey;
                        if (key) newKeys.push(key);
                        observer.unobserve(entry.target);
                    }
                }
                if (newKeys.length > 0) {
                    setVisibleKeys((prev) => {
                        const next = new Set(prev);
                        for (const k of newKeys) next.add(k);
                        return next;
                    });
                }
            },
            { rootMargin: "100% 0px" }
        );
        observerRef.current = observer;
        // Observe elements that mounted before the observer was ready
        for (const el of pendingRef.current) observer.observe(el);
        pendingRef.current = [];
        return () => observer.disconnect();
    }, []);

    const observeRef = useCallback((el: HTMLDivElement | null) => {
        if (!el) return;
        if (observerRef.current) {
            observerRef.current.observe(el);
        } else {
            pendingRef.current.push(el);
        }
    }, []);

    if (isLoading || catalogs.length === 0) return null;

    return (
        <ContentSection label="From Your Addons" icon={<Puzzle className="size-3.5" />}>
            <div className="space-y-1 md:space-y-3">
                {catalogs.map((catalog) => {
                    const key = `${catalog.addonId}-${catalog.type}-${catalog.id}`;
                    return (
                        <div key={key} ref={observeRef} data-catalog-key={key}>
                            <AddonCatalogRow catalog={catalog} isVisible={visibleKeys.has(key)} />
                        </div>
                    );
                })}
            </div>
        </ContentSection>
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
                {/* Addon Catalogs */}
                <AddonCatalogs />

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
