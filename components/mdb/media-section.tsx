"use client";

import { AlertCircle, ArrowRightIcon, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { memo } from "react";
import { ScrollCarousel } from "@/components/common/scroll-carousel";
import { MediaCard } from "@/components/mdb/media-card";
import { Skeleton } from "@/components/ui/skeleton";
import type { MediaItem } from "@/lib/trakt";
import { cn } from "@/lib/utils";

const GRID_ROWS: Record<number, string> = {
    1: "grid-rows-1",
    2: "grid-rows-2",
    3: "grid-rows-3",
};

interface MediaSectionProps {
    title: string;
    titleIcon?: LucideIcon;
    items?: MediaItem[];
    isLoading?: boolean;
    error?: Error | null;
    showRank?: boolean;
    viewAllHref?: string;
    className?: string;
    /** Number of rows in the horizontal scroll grid (default: 2) */
    rows?: number;
}

const MediaSectionSkeleton = memo(function MediaSectionSkeleton({ rows = 2 }: { rows?: number }) {
    return (
        <div
            className={cn(
                "grid grid-flow-col auto-cols-[120px] sm:auto-cols-[140px] md:auto-cols-[160px] gap-3 pt-1 sm:pt-2 pb-4 max-lg:px-4 w-max",
                GRID_ROWS[rows] ?? "grid-rows-2"
            )}>
            {Array.from({ length: 10 * rows }, (_, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: position-based key in static placeholder list
                <div key={i} className="animate-pulse" style={{ animationDelay: `${i * 50}ms` }}>
                    <Skeleton className="aspect-2/3 rounded-sm" />
                </div>
            ))}
        </div>
    );
});

export const MediaSection = memo(function MediaSection({
    title,
    titleIcon: TitleIcon,
    items,
    isLoading,
    error,
    showRank = false,
    viewAllHref,
    className,
    rows = 2,
}: MediaSectionProps) {
    const displayItems = items ?? [];

    if (error) {
        return (
            <section
                className={cn(
                    "space-y-2 sm:space-y-4 [content-visibility:auto] [contain-intrinsic-size:auto_320px]",
                    className
                )}>
                <div className="flex items-center justify-between gap-4">
                    <h2 className="flex items-center gap-1.5 text-[11px] sm:text-sm leading-none tracking-widest uppercase text-muted-foreground">
                        {TitleIcon && <TitleIcon className="size-3 sm:size-4 shrink-0 -mt-1" />}
                        {title}
                    </h2>
                </div>
                <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground py-6 sm:py-8">
                    <AlertCircle className="size-3.5 sm:size-4" />
                    <span>Failed to load content</span>
                </div>
            </section>
        );
    }

    return (
        <section
            className={cn(
                "space-y-2 sm:space-y-4 [content-visibility:auto] [contain-intrinsic-size:auto_320px]",
                className
            )}>
            {/* Section Header */}
            <div className="flex items-center justify-between gap-4">
                <h2 className="flex items-center gap-1.5 text-[11px] sm:text-sm leading-none tracking-widest uppercase text-muted-foreground">
                    {TitleIcon && <TitleIcon className="size-3 sm:size-4 shrink-0 -mt-1" />}
                    {title}
                </h2>
                {viewAllHref && (
                    <Link
                        href={viewAllHref}
                        className="flex items-center gap-1 sm:gap-1.5 text-[11px] sm:text-xs text-muted-foreground hover:text-foreground transition-colors group">
                        <span>View all</span>
                        <ArrowRightIcon className="size-3 sm:size-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
                    </Link>
                )}
            </div>

            {/* Content Grid */}
            <ScrollCarousel className="-mx-4 lg:mx-0">
                {isLoading ? (
                    <MediaSectionSkeleton rows={rows} />
                ) : (
                    <div
                        className={cn(
                            "grid grid-flow-col auto-cols-[120px] sm:auto-cols-[140px] md:auto-cols-[160px] gap-3 pt-1 sm:pt-2 pb-4 max-lg:px-4 w-max",
                            GRID_ROWS[rows] ?? "grid-rows-2"
                        )}>
                        {displayItems.map((item, index) => {
                            const media = item.movie || item.show;
                            if (!media) return null;
                            const type = item.movie ? "movie" : "show";

                            return (
                                <MediaCard
                                    key={`${type}-${media.ids?.imdb || media.ids?.slug || index}`}
                                    media={media}
                                    type={type}
                                    rank={showRank ? index + 1 : undefined}
                                />
                            );
                        })}
                    </div>
                )}
            </ScrollCarousel>
        </section>
    );
});
