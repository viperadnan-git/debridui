"use client";

import { MediaCard } from "@/components/mdb/media-card";
import { type TraktMediaItem } from "@/lib/trakt";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { memo } from "react";
import { ScrollCarousel } from "@/components/common/scroll-carousel";

interface MediaSectionProps {
    title: string;
    items?: TraktMediaItem[];
    isLoading?: boolean;
    error?: Error | null;
    showRank?: boolean;
    viewAllHref?: string;
}

const skeletonCards = Array.from({ length: 20 }, (_, i) => (
    <div key={i}>
        <Skeleton className="aspect-2/3 rounded-md" />
    </div>
));

export const MediaSection = memo(function MediaSection({
    title,
    items,
    isLoading,
    error,
    showRank = false,
    viewAllHref,
}: MediaSectionProps) {
    if (error) {
        return (
            <section className="space-y-4">
                <h2 className="text-2xl font-bold">{title}</h2>
                <div className="text-muted-foreground">Failed to load {title.toLowerCase()}</div>
            </section>
        );
    }

    return (
        <section className="space-y-2 sm:space-y-3 lg:space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-lg sm:text-xl lg:text-2xl font-bold">{title}</h2>
                {viewAllHref && (
                    <Link
                        href={viewAllHref}
                        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
                        View All
                        <ChevronRight className="h-4 w-4" />
                    </Link>
                )}
            </div>

            <ScrollCarousel className="-mx-4 lg:mx-0">
                <div className="grid grid-rows-2 grid-flow-col auto-cols-[120px] sm:auto-cols-[150px] md:auto-cols-[180px] gap-2 lg:gap-4 py-3 max-md:px-4">
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
