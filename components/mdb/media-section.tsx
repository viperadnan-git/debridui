"use client";

import { MediaCard } from "@/components/mdb/media-card";
import { type TraktMediaItem } from "@/lib/trakt";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";
import { memo } from "react";
import { ScrollCarousel } from "@/components/common/scroll-carousel";

interface MediaSectionProps {
    title: string;
    label?: string;
    items?: TraktMediaItem[];
    isLoading?: boolean;
    error?: Error | null;
    showRank?: boolean;
    viewAllHref?: string;
}

const skeletonCards = Array.from({ length: 20 }, (_, i) => (
    <div key={i}>
        <Skeleton className="aspect-2/3 rounded-sm" />
    </div>
));

export const MediaSection = memo(function MediaSection({
    title,
    label,
    items,
    isLoading,
    error,
    showRank = false,
    viewAllHref,
}: MediaSectionProps) {
    if (error) {
        return (
            <section className="space-y-4">
                <div className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground">{label || title}</div>
                <div className="text-sm text-muted-foreground">Failed to load content</div>
            </section>
        );
    }

    return (
        <section className="space-y-4">
            {/* Section Header */}
            <div className="flex items-end justify-between gap-4">
                <div className="space-y-1">
                    {label && (
                        <div className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground">{label}</div>
                    )}
                    <h2 className="text-xl sm:text-2xl font-light">{title}</h2>
                </div>
                {viewAllHref && (
                    <Link
                        href={viewAllHref}
                        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors pb-1">
                        View all
                        <ArrowRightIcon className="size-3" />
                    </Link>
                )}
            </div>

            {/* Content Grid - edge to edge scroll on mobile */}
            <ScrollCarousel className="-mx-4 lg:mx-0">
                <div className="grid grid-rows-2 grid-flow-col auto-cols-[120px] sm:auto-cols-[140px] md:auto-cols-[160px] gap-3 pt-2 pb-4 max-lg:px-4 w-max">
                    {isLoading
                        ? skeletonCards
                        : items
                              ?.slice(0, 20)
                              .filter((item) => item.movie || item.show)
                              .map((item, index) => {
                                  const media = item.movie || item.show;
                                  const type = item.movie ? "movie" : "show";

                                  return (
                                      <MediaCard
                                          key={`${type}-${media!.ids?.trakt || index}`}
                                          media={media!}
                                          type={type}
                                          rank={showRank ? index + 1 : undefined}
                                          watchers={item.watchers}
                                      />
                                  );
                              })}
                </div>
            </ScrollCarousel>
        </section>
    );
});
