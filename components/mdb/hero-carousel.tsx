"use client";

import { useEffect, useState, memo, useMemo, useRef, useCallback } from "react";
import { type TraktMediaItem } from "@/lib/trakt";
import { Button } from "@/components/ui/button";
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel";
import { WatchButton } from "@/components/common/watch-button";
import Link from "next/link";
import { ArrowRightIcon, Star, Play, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import Autoplay from "embla-carousel-autoplay";
import { useTraktTrendingMixed } from "@/hooks/use-trakt";
import { WheelGesturesPlugin } from "embla-carousel-wheel-gestures";
import { HeroCarouselSkeleton } from "./hero-carousel-skeleton";

interface HeroSlideProps {
    item: TraktMediaItem;
    index: number;
    total: number;
    isActive: boolean;
}

const HeroSlide = memo(function HeroSlide({ item, index, total, isActive }: HeroSlideProps) {
    const media = item.movie || item.show;
    const type = item.movie ? "movie" : "show";
    if (!media) return null;

    const fanartImage = media.images?.fanart?.[0] ? `https://${media.images.fanart[0]}` : null;
    const posterImage = media.images?.poster?.[0] ? `https://${media.images.poster[0]}` : null;
    const placeholderImage = `https://placehold.co/1920x1080/1a1a1a/3e3e3e?text=${encodeURIComponent(media.title)}`;

    const desktopImage = fanartImage || placeholderImage;
    const mobileImage = posterImage || fanartImage || placeholderImage;

    const slug = media.ids?.slug || media.ids?.imdb;
    const linkHref = slug ? `/${type}s/${slug}` : "#";

    const genres = media.genres?.slice(0, 3) || [];

    return (
        <div className="relative w-full">
            {/* Desktop Layout */}
            <div className="hidden md:block relative w-full aspect-[2/1] overflow-hidden">
                {/* Background Image with Ken Burns effect */}
                <div
                    className={cn(
                        "absolute inset-0 transition-transform duration-[8000ms] ease-out",
                        isActive ? "scale-105" : "scale-100"
                    )}>
                    <img
                        src={desktopImage}
                        alt=""
                        className="w-full h-full object-cover"
                        loading={index < 2 ? "eager" : "lazy"}
                        decoding="async"
                    />
                </div>

                {/* Cinematic gradient overlays */}
                <div className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/30" />
                <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-transparent to-transparent" />

                {/* Film grain texture overlay */}
                <div
                    className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay"
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
                    }}
                />

                {/* Content */}
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full max-w-7xl mx-auto px-8 lg:px-12 xl:px-16">
                        <div
                            className={cn(
                                "max-w-2xl space-y-5 transition-all duration-700",
                                isActive ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                            )}
                            style={{ transitionDelay: isActive ? "200ms" : "0ms" }}>
                            {/* Type & Index */}
                            <div className="flex items-center gap-4">
                                <span className="text-xs tracking-widest uppercase text-primary font-medium">
                                    {type === "movie" ? "Film" : "Series"}
                                </span>
                                <div className="h-px w-8 bg-border/50" />
                                <span className="text-xs tracking-wider text-muted-foreground tabular-nums">
                                    {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
                                </span>
                            </div>

                            {/* Title */}
                            <h1 className="text-4xl lg:text-5xl xl:text-6xl font-light leading-tightest tracking-tight">
                                {media.title}
                            </h1>

                            {/* Meta & Genres */}
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                    {media.year && <span className="font-medium text-foreground">{media.year}</span>}
                                    {media.rating && (
                                        <>
                                            <span className="text-border">·</span>
                                            <span className="flex items-center gap-1.5">
                                                <Star className="size-4 fill-primary text-primary" />
                                                <span className="font-medium text-foreground">
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
                                </div>
                                {genres.length > 0 && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-border hidden sm:inline">·</span>
                                        <div className="flex gap-2">
                                            {genres.map((genre) => (
                                                <span
                                                    key={genre}
                                                    className="text-xs px-2 py-0.5 bg-muted/30 text-muted-foreground rounded-sm capitalize">
                                                    {genre}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Overview */}
                            {media.overview && (
                                <p className="text-muted-foreground text-base lg:text-lg leading-relaxed line-clamp-2 max-w-xl">
                                    {media.overview}
                                </p>
                            )}

                            {/* CTA */}
                            <div className="flex items-center gap-3 pt-2">
                                {type === "movie" ? (
                                    <WatchButton imdbId={media.ids?.imdb || ""} mediaType={type} title={media.title}>
                                        <Button size="lg" className="h-11 px-6 gap-2.5">
                                            <Play className="size-4 fill-current" />
                                            Watch Now
                                        </Button>
                                    </WatchButton>
                                ) : (
                                    <Link href={`${linkHref}#seasons`}>
                                        <Button size="lg" className="h-11 px-6 gap-2.5">
                                            <Play className="size-4 fill-current" />
                                            Browse Episodes
                                        </Button>
                                    </Link>
                                )}
                                <Link href={linkHref}>
                                    <Button
                                        variant="outline"
                                        size="lg"
                                        className="h-11 px-6 bg-background/50 backdrop-blur-sm border-border/50 hover:bg-background/80">
                                        More Info
                                        <ArrowRightIcon className="size-4 ml-1" />
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Layout */}
            <div className="md:hidden relative w-full aspect-[9/14] overflow-hidden">
                {/* Background */}
                <div
                    className={cn(
                        "absolute inset-0 transition-transform duration-[8000ms] ease-out",
                        isActive ? "scale-105" : "scale-100"
                    )}>
                    <img
                        src={mobileImage}
                        alt=""
                        className="w-full h-full object-cover"
                        loading={index < 2 ? "eager" : "lazy"}
                        decoding="async"
                    />
                </div>

                {/* Gradient overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-transparent to-transparent" />

                {/* Film grain */}
                <div
                    className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay"
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
                    }}
                />

                {/* Top indicator */}
                <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                    <span className="text-xs tracking-widest uppercase text-primary font-medium">
                        {type === "movie" ? "Film" : "Series"}
                    </span>
                    <span className="text-xs tracking-wider text-muted-foreground tabular-nums">
                        {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
                    </span>
                </div>

                {/* Bottom content */}
                <div className="absolute inset-x-0 bottom-0 p-4 pb-14">
                    <div
                        className={cn(
                            "space-y-3 transition-all duration-500",
                            isActive ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                        )}
                        style={{ transitionDelay: isActive ? "200ms" : "0ms" }}>
                        {/* Title */}
                        <h2 className="text-2xl font-light leading-tight line-clamp-2">{media.title}</h2>

                        {/* Meta */}
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            {media.year && <span className="font-medium text-foreground">{media.year}</span>}
                            {media.rating && (
                                <>
                                    <span className="text-border">·</span>
                                    <span className="flex items-center gap-1">
                                        <Star className="size-3.5 fill-primary text-primary" />
                                        <span className="font-medium text-foreground">{media.rating.toFixed(1)}</span>
                                    </span>
                                </>
                            )}
                            {media.runtime && (
                                <>
                                    <span className="text-border">·</span>
                                    <span>{media.runtime}m</span>
                                </>
                            )}
                        </div>

                        {/* Overview */}
                        {media.overview && (
                            <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                                {media.overview}
                            </p>
                        )}

                        {/* CTA */}
                        <div className="flex items-center gap-2 pt-1">
                            {type === "movie" ? (
                                <WatchButton imdbId={media.ids?.imdb || ""} mediaType={type} title={media.title}>
                                    <Button className="flex-1 h-10 gap-2">
                                        <Play className="size-4 fill-current" />
                                        Watch Now
                                    </Button>
                                </WatchButton>
                            ) : (
                                <Link href={`${linkHref}#seasons`} className="flex-1">
                                    <Button className="w-full h-10 gap-2">
                                        <Play className="size-4 fill-current" />
                                        Browse Episodes
                                    </Button>
                                </Link>
                            )}
                            <Link href={linkHref}>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="size-10 bg-background/50 backdrop-blur-sm border-border/50">
                                    <ArrowRightIcon className="size-4" />
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
});

interface HeroCarouselProps {
    autoFocus?: boolean;
}

export const HeroCarousel = memo(function HeroCarousel({ autoFocus = false }: HeroCarouselProps) {
    const carouselRef = useRef<HTMLDivElement>(null);
    const [api, setApi] = useState<CarouselApi>();
    const [current, setCurrent] = useState(0);
    const [count, setCount] = useState(0);

    const autoplay = useMemo(
        () =>
            Autoplay({
                delay: 6000,
                stopOnInteraction: false,
                stopOnMouseEnter: true,
                playOnInit: false,
            }),
        []
    );

    const { data: items, isLoading } = useTraktTrendingMixed(10);

    const scrollPrev = useCallback(() => api?.scrollPrev(), [api]);
    const scrollNext = useCallback(() => api?.scrollNext(), [api]);
    const scrollTo = useCallback((index: number) => api?.scrollTo(index), [api]);

    useEffect(() => {
        if (!api) return;

        setCount(api.scrollSnapList().length);
        setCurrent(api.selectedScrollSnap());

        const onSelect = () => setCurrent(api.selectedScrollSnap());
        api.on("select", onSelect);

        if (!isLoading) {
            autoplay.play();
            if (autoFocus) {
                carouselRef.current?.focus();
            }
        }

        return () => {
            api.off("select", onSelect);
        };
    }, [api, autoplay, isLoading, autoFocus]);

    if (isLoading) {
        return <HeroCarouselSkeleton />;
    }

    const mixed = items?.mixed;

    if (!mixed || mixed.length === 0) {
        return null;
    }

    return (
        <div className="-mx-4 -mt-6 lg:-mx-6 relative group/hero">
            <Carousel
                ref={carouselRef}
                tabIndex={0}
                setApi={setApi}
                className="w-full outline-none"
                opts={{
                    align: "start",
                    loop: true,
                }}
                plugins={[autoplay, WheelGesturesPlugin()]}>
                <CarouselContent className="-ml-0">
                    {mixed.map((item: TraktMediaItem, index: number) => (
                        <CarouselItem key={`hero-${index}`} className="pl-0">
                            <HeroSlide item={item} index={index} total={mixed.length} isActive={index === current} />
                        </CarouselItem>
                    ))}
                </CarouselContent>
            </Carousel>

            {/* Desktop Navigation */}
            <div className="hidden md:flex absolute inset-y-0 left-4 lg:left-8 items-center z-10">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={scrollPrev}
                    className="size-12 rounded-full bg-background/60 backdrop-blur-sm border border-border/50 text-foreground hover:bg-background/80 opacity-0 group-hover/hero:opacity-100 transition-all duration-300 -translate-x-2 group-hover/hero:translate-x-0">
                    <ChevronLeft className="size-5" />
                </Button>
            </div>
            <div className="hidden md:flex absolute inset-y-0 right-4 lg:right-8 items-center z-10">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={scrollNext}
                    className="size-12 rounded-full bg-background/60 backdrop-blur-sm border border-border/50 text-foreground hover:bg-background/80 opacity-0 group-hover/hero:opacity-100 transition-all duration-300 translate-x-2 group-hover/hero:translate-x-0">
                    <ChevronRight className="size-5" />
                </Button>
            </div>

            {/* Progress Indicator */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10">
                <div className="flex items-center gap-1.5 px-3 py-2 bg-background/60 backdrop-blur-sm rounded-full border border-border/30">
                    {Array.from({ length: count }, (_, index) => (
                        <button
                            key={index}
                            onClick={() => scrollTo(index)}
                            aria-label={`Go to slide ${index + 1}`}
                            className={cn(
                                "h-1 rounded-full transition-all duration-500 cursor-pointer",
                                index === current ? "w-6 bg-primary" : "w-1.5 bg-foreground/30 hover:bg-foreground/50"
                            )}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
});
