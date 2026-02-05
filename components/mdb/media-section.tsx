"use client";

import { MediaCard } from "@/components/mdb/media-card";
import { type MediaItem } from "@/lib/trakt";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRightIcon, AlertCircle, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { memo } from "react";
import { ScrollCarousel } from "@/components/common/scroll-carousel";
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
                "grid grid-flow-col auto-cols-[120px] sm:auto-cols-[140px] md:auto-cols-[160px] gap-3 pt-2 pb-4 max-lg:px-4 w-max",
                GRID_ROWS[rows] ?? "grid-rows-2"
            )}>
            {Array.from({ length: 10 * rows }, (_, i) => (
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
            <section className={cn("space-y-4", className)}>
                <div className="flex items-center justify-between gap-4">
                    <h2 className="flex items-center gap-1.5 text-xs sm:text-sm leading-none tracking-widest uppercase text-muted-foreground">
                        {TitleIcon && <TitleIcon className="size-3.5 sm:size-4 shrink-0 -mt-0.5" />}
                        {title}
                    </h2>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-8">
                    <AlertCircle className="size-4" />
                    <span>Failed to load content</span>
                </div>
            </section>
        );
    }

    return (
        <section className={cn("space-y-4", className)}>
            {/* Section Header */}
            <div className="flex items-center justify-between gap-4">
                <h2 className="flex items-center gap-1.5 text-xs sm:text-sm leading-none tracking-widest uppercase text-muted-foreground">
                    {TitleIcon && <TitleIcon className="size-3.5 sm:size-4 shrink-0 -mt-0.5" />}
                    {title}
                </h2>
                {viewAllHref && (
                    <Link
                        href={viewAllHref}
                        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors group">
                        <span>View all</span>
                        <ArrowRightIcon className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
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
                            "grid grid-flow-col auto-cols-[120px] sm:auto-cols-[140px] md:auto-cols-[160px] gap-3 pt-2 pb-4 max-lg:px-4 w-max",
                            GRID_ROWS[rows] ?? "grid-rows-2"
                        )}>
                        {displayItems.map((item, index) => {
                            const media = item.movie || item.show;
                            if (!media) return null;
                            const type = item.movie ? "movie" : "show";

                            return (
                                <div
                                    key={`${type}-${media.ids?.imdb || media.ids?.slug || index}`}
                                    className="animate-in fade-in-0 slide-in-from-bottom-2"
                                    style={{
                                        animationDelay: `${Math.min(index * 30, 300)}ms`,
                                        animationDuration: "400ms",
                                        animationFillMode: "backwards",
                                    }}>
                                    <MediaCard media={media} type={type} rank={showRank ? index + 1 : undefined} />
                                </div>
                            );
                        })}
                    </div>
                )}
            </ScrollCarousel>
        </section>
    );
});
