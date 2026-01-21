"use client";

import { useEffect, useState, memo, useMemo } from "react";
import { type TraktMediaItem } from "@/lib/trakt";
import { Badge } from "@/components/ui/badge";
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
import { StarIcon, CalendarIcon, InfoIcon } from "lucide-react";
import { cn } from "@/lib/utils";
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
                {}
                <img
                    src={desktopImage}
                    alt={media.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    decoding="async"
                />
                {/* Netflix-style gradients */}
                <div className="absolute inset-0 bg-linear-to-r from-black via-black/50 to-transparent" />
                <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent" />
            </div>

            {/* Content Overlay */}
            <div className="absolute inset-0 flex items-center mx-12">
                <div className="container mx-auto px-4 lg:px-8">
                    <div className="max-w-2xl space-y-4 lg:space-y-6">
                        {/* Netflix Series/Movie Badge */}
                        <div className="flex items-center gap-3">
                            <Badge variant="outline" className="border-white/30 text-white bg-black/30">
                                {type === "movie" ? "Movie" : "Series"}
                            </Badge>
                        </div>

                        {/* Title */}
                        <h1 className="text-4xl lg:text-6xl xl:text-7xl font-bold text-white leading-tight">
                            {media.title}
                        </h1>

                        {/* Meta Information */}
                        <div className="flex items-center gap-4 text-white/80">
                            {media.rating && (
                                <div className="flex items-center gap-1">
                                    <StarIcon className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                    <span className="font-medium">{media.rating.toFixed(1)}</span>
                                </div>
                            )}
                            {media.year && (
                                <div className="flex items-center gap-1">
                                    <CalendarIcon className="h-4 w-4" />
                                    <span>{media.year}</span>
                                </div>
                            )}
                            {media.runtime && (
                                <span>
                                    {Math.floor(media.runtime / 60)}h {media.runtime % 60}m
                                </span>
                            )}
                            <Badge className="bg-red-600 text-white text-sm font-bold px-3 py-1">
                                #{index + 1} Today
                            </Badge>
                        </div>

                        {/* Description */}
                        {media.overview && (
                            <p className="text-white/90 text-lg lg:text-xl leading-tight max-w-xl line-clamp-3">
                                {media.overview}
                            </p>
                        )}

                        {/* CTA Button */}
                        <div className="flex items-center gap-3">
                            <Link href={linkHref}>
                                <Button
                                    size="lg"
                                    variant="outline"
                                    className="bg-white/10 text-white border-white/40 hover:bg-white/20 font-semibold px-8">
                                    <InfoIcon className="h-5 w-5 mr-2" />
                                    View Details
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
                {}
                <img
                    src={mobileImage}
                    alt={media.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    decoding="async"
                />
                {/* Mobile gradients */}
                <div className="absolute inset-0 bg-linear-to-t from-black via-black/40 to-transparent" />
            </div>

            {/* Mobile Content */}
            <div className="absolute inset-0 flex flex-col justify-between p-4">
                {/* Bottom content */}
                <div className="space-y-3 mt-auto">
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="border-white/30 text-white bg-black/40 text-xs">
                            {type === "movie" ? "Movie" : "Series"}
                        </Badge>
                        {media.rating && (
                            <Badge variant="outline" className="border-white/30 text-white bg-black/40">
                                <StarIcon className="h-3 w-3 fill-yellow-400 text-yellow-400 mr-1" />
                                {media.rating.toFixed(1)}
                            </Badge>
                        )}
                        <Badge className="bg-red-600 text-white text-xs font-bold">#{index + 1}</Badge>
                    </div>

                    <h2 className="text-white font-bold text-xl leading-tight line-clamp-2">{media.title}</h2>

                    <div className="flex items-center gap-2 text-xs text-white/80">
                        {media.year && <span>{media.year}</span>}
                        {media.runtime && (
                            <span>
                                • {Math.floor(media.runtime / 60)}h {media.runtime % 60}m
                            </span>
                        )}
                    </div>

                    {media.overview && (
                        <p className="text-white/80 text-sm line-clamp-3 leading-relaxed">{media.overview}</p>
                    )}

                    {/* Mobile CTA button */}
                    <div className="flex items-center gap-2">
                        <Link href={linkHref} className="w-full">
                            <Button
                                size="sm"
                                variant="outline"
                                className="bg-white/10 text-white border-white/40 hover:bg-white/20 w-full">
                                <InfoIcon className="h-4 w-4 mr-1" />
                                View Details
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
            <div className="relative w-full">
                {/* Desktop skeleton */}
                <div className="hidden md:block">
                    <Skeleton className="w-full aspect-video" />
                </div>
                {/* Mobile skeleton */}
                <div className="md:hidden">
                    <Skeleton className="w-full aspect-9/16" />
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
                    <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 border-white/20 text-white hover:bg-black/70" />
                    <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 border-white/20 text-white hover:bg-black/70" />
                </div>
            </Carousel>

            {/* Dots Indicator */}
            <div className="flex justify-center gap-2 mt-4 px-4">
                {Array.from({ length: count }, (_, index) => (
                    <button
                        key={index}
                        onClick={() => api?.scrollTo(index)}
                        className={cn(
                            "h-2 rounded-full transition-all duration-300 cursor-pointer",
                            index === current - 1 ? "w-8 bg-white" : "w-2 bg-white/40 hover:bg-white/60"
                        )}
                    />
                ))}
            </div>
        </div>
    );
}
