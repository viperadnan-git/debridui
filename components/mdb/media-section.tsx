"use client";

import { MediaCard } from "@/components/mdb/media-card";
import { type TraktMediaItem } from "@/lib/trakt";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRightIcon, AlertCircle } from "lucide-react";
import Link from "next/link";
import { memo, useMemo } from "react";
import { ScrollCarousel } from "@/components/common/scroll-carousel";
import { cn } from "@/lib/utils";

interface MediaSectionProps {
    title: string;
    items?: TraktMediaItem[];
    isLoading?: boolean;
    error?: Error | null;
    showRank?: boolean;
    viewAllHref?: string;
    className?: string;
}

const MediaSectionSkeleton = memo(function MediaSectionSkeleton() {
    return (
        <div className="grid grid-rows-2 grid-flow-col auto-cols-[120px] sm:auto-cols-[140px] md:auto-cols-[160px] gap-3 pt-2 pb-4 max-lg:px-4 w-max">
            {Array.from({ length: 20 }, (_, i) => (
                <div key={i} className="animate-pulse" style={{ animationDelay: `${i * 50}ms` }}>
                    <Skeleton className="aspect-2/3 rounded-sm" />
                </div>
            ))}
        </div>
    );
});

export const MediaSection = memo(function MediaSection({
    title,
    items,
    isLoading,
    error,
    showRank = false,
    viewAllHref,
    className,
}: MediaSectionProps) {
    const filteredItems = useMemo(() => items?.slice(0, 20).filter((item) => item.movie || item.show) ?? [], [items]);

    if (error) {
        return (
            <section className={cn("space-y-4", className)}>
                <div className="flex items-end justify-between gap-4">
                    <h2 className="text-sm tracking-widest uppercase text-muted-foreground">{title}</h2>
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
            <div className="flex items-end justify-between gap-4">
                <h2 className="text-sm tracking-widest uppercase text-muted-foreground">{title}</h2>
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
                    <MediaSectionSkeleton />
                ) : (
                    <div className="grid grid-rows-2 grid-flow-col auto-cols-[120px] sm:auto-cols-[140px] md:auto-cols-[160px] gap-3 pt-2 pb-4 max-lg:px-4 w-max">
                        {filteredItems.map((item, index) => {
                            const media = item.movie || item.show;
                            const type = item.movie ? "movie" : "show";

                            return (
                                <div
                                    key={`${type}-${media!.ids?.trakt || index}`}
                                    className="animate-in fade-in-0 slide-in-from-bottom-2"
                                    style={{
                                        animationDelay: `${Math.min(index * 30, 300)}ms`,
                                        animationDuration: "400ms",
                                        animationFillMode: "backwards",
                                    }}>
                                    <MediaCard
                                        media={media!}
                                        type={type}
                                        rank={showRank ? index + 1 : undefined}
                                        watchers={item.watchers}
                                    />
                                </div>
                            );
                        })}
                    </div>
                )}
            </ScrollCarousel>
        </section>
    );
});
