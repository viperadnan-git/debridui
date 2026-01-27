"use client";

import { useEffect, useState, memo, useMemo } from "react";
import { type TraktMediaItem } from "@/lib/trakt";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
    CarouselApi,
} from "@/components/ui/carousel";
import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { ImdbIcon } from "@/components/icons";
import Autoplay from "embla-carousel-autoplay";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTraktTrendingMixed } from "@/hooks/use-trakt";
import { WheelGesturesPlugin } from "embla-carousel-wheel-gestures";

interface DesktopHeroCarouselProps {
    item: TraktMediaItem;
    index: number;
}

interface MobileHeroCarouselProps {
    item: TraktMediaItem;
    index: number;
}

const DesktopHeroCarousel = memo(function DesktopHeroCarousel({ item, index }: DesktopHeroCarouselProps) {
    const media = item.movie || item.show;
    const type = item.movie ? "movie" : "show";
    if (!media) return null;

    const desktopImage = media.images?.fanart?.[0]
        ? `https://${media.images.fanart[0]}`
        : `https://placehold.co/1920x1080/1a1a1a/white?text=${encodeURIComponent(media.title)}`;

    const slug = media.ids?.slug || media.ids?.imdb;
    const linkHref = slug ? `/${type}/${slug}` : "#";

    return (
        <div className="relative w-full aspect-video overflow-hidden">
            {/* Background Image */}
            <div className="absolute inset-0">
                <img
                    src={desktopImage}
                    alt={media.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    decoding="async"
                />
                {/* Cinematic gradients - always dark for text readability */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
            </div>

            {/* Content Overlay */}
            <div className="absolute inset-0 flex items-center mx-12">
                <div className="container mx-auto px-4 lg:px-8">
                    <div className="max-w-2xl space-y-4 lg:space-y-5">
                        {/* Type Label */}
                        <div className="flex items-center gap-3">
                            <span className="text-xs tracking-widest uppercase text-white/60">
                                {type === "movie" ? "Film" : "Series"}
                            </span>
                            <span className="text-xs tracking-wider text-white/40">
                                {String(index + 1).padStart(2, "0")} / 10
                            </span>
                        </div>

                        {/* Title */}
                        <h1 className="text-4xl lg:text-6xl xl:text-7xl font-light text-white leading-tightest">
                            {media.title}
                        </h1>

                        {/* Meta Information */}
                        <div className="flex items-center gap-3 text-sm text-white/70">
                            {media.year && <span>{media.year}</span>}
                            {media.rating && (
                                <>
                                    <span className="text-white/30">·</span>
                                    <span className="flex items-center gap-1.5">
                                        <ImdbIcon className="size-4 text-[#F5C518]" />
                                        <span className="text-white font-medium">{media.rating.toFixed(1)}</span>
                                    </span>
                                </>
                            )}
                            {media.runtime && (
                                <>
                                    <span className="text-white/30">·</span>
                                    <span>{media.runtime}m</span>
                                </>
                            )}
                        </div>

                        {/* Description */}
                        {media.overview && (
                            <p className="text-white/60 text-base lg:text-lg leading-relaxed max-w-xl line-clamp-2">
                                {media.overview}
                            </p>
                        )}

                        {/* CTA Button */}
                        <div className="flex items-center gap-3 pt-2">
                            <Link href={linkHref}>
                                <Button
                                    size="lg"
                                    variant="outline"
                                    className="h-12 px-6 bg-white/10 text-white border-white/20 hover:bg-white/20 backdrop-blur-sm">
                                    View Details
                                    <ArrowRightIcon className="size-4 ml-2" />
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
});

const MobileHeroCarousel = memo(function MobileHeroCarousel({ item, index }: MobileHeroCarouselProps) {
    const media = item.movie || item.show;
    const type = item.movie ? "movie" : "show";
    if (!media) return null;

    const mobileImage = media.images?.poster?.[0]
        ? `https://${media.images.poster[0]}`
        : `https://placehold.co/500x750/1a1a1a/white?text=${encodeURIComponent(media.title)}`;

    const linkHref = media.ids?.slug ? `/${type}/${media.ids.slug}` : "#";

    return (
        <div className="md:hidden relative w-full aspect-9/14 overflow-hidden">
            {/* Background Image */}
            <div className="absolute inset-0">
                <img
                    src={mobileImage}
                    alt={media.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    decoding="async"
                />
                {/* Mobile gradients - always dark for text readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            </div>

            {/* Mobile Content */}
            <div className="absolute inset-0 flex flex-col justify-between p-4">
                {/* Bottom content */}
                <div className="space-y-3 mt-auto">
                    <div className="flex items-center gap-3">
                        <span className="text-xs tracking-widest uppercase text-white/60">
                            {type === "movie" ? "Film" : "Series"}
                        </span>
                        <span className="text-xs tracking-wider text-white/40">
                            {String(index + 1).padStart(2, "0")}
                        </span>
                    </div>

                    <h2 className="text-white font-light text-2xl leading-tight line-clamp-2">{media.title}</h2>

                    <div className="flex items-center gap-2 text-sm text-white/70">
                        {media.year && <span>{media.year}</span>}
                        {media.rating && (
                            <>
                                <span className="text-white/30">·</span>
                                <span className="flex items-center gap-1">
                                    <ImdbIcon className="size-3.5 text-[#F5C518]" />
                                    {media.rating.toFixed(1)}
                                </span>
                            </>
                        )}
                    </div>

                    {media.overview && (
                        <p className="text-white/50 text-sm line-clamp-2 leading-relaxed">{media.overview}</p>
                    )}

                    {/* Mobile CTA button */}
                    <div className="flex items-center gap-2 pt-1">
                        <Link href={linkHref}>
                            <Button
                                variant="outline"
                                className="h-10 px-5 bg-white/10 text-white border-white/20 hover:bg-white/20 backdrop-blur-sm">
                                View Details
                                <ArrowRightIcon className="size-3.5 ml-2" />
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
});

export function HeroCarousel() {
    const isMobile = useIsMobile();
    const [api, setApi] = useState<CarouselApi>();
    const [current, setCurrent] = useState(0);
    const [count, setCount] = useState(0);
    const autoplay = useMemo(
        () =>
            Autoplay({
                delay: 5000,
                stopOnInteraction: false,
                stopOnMouseEnter: true,
                playOnInit: false,
            }),
        []
    );

    const { data: items, isLoading } = useTraktTrendingMixed(10);

    useEffect(() => {
        if (!api) return;

        setCount(api.scrollSnapList().length);
        setCurrent(api.selectedScrollSnap() + 1);

        api.on("select", () => {
            setCurrent(api.selectedScrollSnap() + 1);
        });

        if (!isLoading) {
            autoplay.play();
        }
    }, [api, autoplay, isLoading]);

    if (isLoading) {
        return (
            <div className="-mx-4 -mt-6">
                {/* Desktop skeleton */}
                <div className="hidden md:block">
                    <Skeleton className="w-full aspect-video" />
                </div>
                {/* Mobile skeleton */}
                <div className="md:hidden">
                    <Skeleton className="w-full aspect-9/14" />
                </div>
            </div>
        );
    }

    const mixed = items?.mixed;

    if (!mixed || mixed.length === 0) {
        return null;
    }

    return (
        <div className="-mx-4 -mt-6">
            <Carousel
                setApi={setApi}
                className="w-full"
                opts={{
                    align: "start",
                    loop: true,
                }}
                plugins={[autoplay, WheelGesturesPlugin()]}>
                <CarouselContent>
                    {mixed.map((item: TraktMediaItem, index: number) => {
                        return (
                            <CarouselItem key={`carousel-item-${index}`}>
                                {isMobile ? (
                                    <MobileHeroCarousel item={item} index={index} />
                                ) : (
                                    <DesktopHeroCarousel item={item} index={index} />
                                )}
                            </CarouselItem>
                        );
                    })}
                </CarouselContent>

                {/* Desktop Navigation Arrows */}
                <div className="hidden md:block">
                    <CarouselPrevious className="absolute left-4 lg:left-6 top-1/2 -translate-y-1/2 size-10 bg-black/40 border-white/20 text-white backdrop-blur-sm hover:bg-black/60" />
                    <CarouselNext className="absolute right-4 lg:right-6 top-1/2 -translate-y-1/2 size-10 bg-black/40 border-white/20 text-white backdrop-blur-sm hover:bg-black/60" />
                </div>
            </Carousel>

            {/* Dots Indicator */}
            <div className="flex justify-center gap-1.5 mt-4 px-4">
                {Array.from({ length: count }, (_, index) => (
                    <button
                        key={index}
                        onClick={() => api?.scrollTo(index)}
                        aria-label={`Go to slide ${index + 1}`}
                        className={cn(
                            "h-1 rounded-full transition-all duration-300 cursor-pointer",
                            index === current - 1 ? "w-6 bg-foreground" : "w-1 bg-foreground/20 hover:bg-foreground/40"
                        )}
                    />
                ))}
            </div>
        </div>
    );
}
