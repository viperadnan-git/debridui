"use client";

import { memo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import type { TraktMedia } from "@/lib/trakt";
import { MovieDetails } from "./movie-details";
import { ShowDetails } from "./show-details";

interface MediaDetailsProps {
    media?: TraktMedia;
    mediaId: string;
    type: "movie" | "show";
    isLoading?: boolean;
    error?: Error | null;
}

const MediaSkeleton = memo(function MediaSkeleton() {
    return (
        <div className="relative min-h-svh">
            {/* Backdrop — matches MediaHeader heights */}
            <div className="absolute inset-x-0 top-0 -mt-6 h-[42vh] sm:h-[50vh] md:h-[60vh] lg:h-[85vh] overflow-hidden left-1/2 -translate-x-1/2 w-screen">
                <Skeleton className="w-full h-full rounded-none opacity-60" />
                <div className="absolute inset-0 bg-linear-to-t from-background via-background/60 to-transparent" />
                <div className="absolute inset-0 bg-linear-to-r from-background/70 via-transparent to-background/70" />
            </div>

            <div className="relative pt-[16vh] sm:pt-[20vh] md:pt-[26vh] lg:pt-[30vh] pb-4 md:pb-6 lg:pb-8">
                <div className="grid md:grid-cols-[200px_1fr] lg:grid-cols-[240px_1fr] gap-5 md:gap-8">
                    {/* Mobile/Tablet: poster + title side-by-side. Desktop: poster column only */}
                    <div className="flex gap-4 md:block md:space-y-4">
                        <Skeleton className="w-24 sm:w-32 md:w-full shrink-0 aspect-2/3 rounded-sm" />

                        {/* Mobile title block — sits next to poster */}
                        <div className="flex-1 min-w-0 flex flex-col justify-end gap-2 md:hidden">
                            <Skeleton className="h-3 w-14" />
                            <Skeleton className="h-7 sm:h-9 w-5/6" />
                            <Skeleton className="h-7 sm:h-9 w-3/5" />
                            <div className="flex flex-wrap items-center gap-2 pt-1">
                                <Skeleton className="h-3 w-10" />
                                <Skeleton className="h-3 w-12" />
                                <Skeleton className="h-3 w-10" />
                            </div>
                        </div>

                        {/* Desktop action buttons under poster */}
                        <div className="hidden md:flex flex-col gap-2">
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                    </div>

                    {/* Info column */}
                    <div className="space-y-4 md:space-y-5 lg:space-y-6">
                        {/* Desktop-only title block */}
                        <div className="hidden md:block space-y-3">
                            <Skeleton className="h-3 w-16" />
                            <Skeleton className="h-9 lg:h-12 w-3/4" />
                            <Skeleton className="h-9 lg:h-12 w-1/2" />
                        </div>

                        {/* Mobile primary action */}
                        <div className="md:hidden flex gap-2">
                            <Skeleton className="h-9 flex-1" />
                            <Skeleton className="h-9 w-9" />
                        </div>

                        {/* Desktop metadata line */}
                        <div className="hidden md:flex flex-wrap items-center gap-x-3 gap-y-1">
                            <Skeleton className="h-4 w-12" />
                            <Skeleton className="h-4 w-16" />
                            <Skeleton className="h-4 w-12" />
                            <Skeleton className="h-5 w-10" />
                        </div>

                        {/* Genres */}
                        <div className="flex flex-wrap gap-1.5 md:gap-2">
                            <Skeleton className="h-5 w-14 rounded-sm" />
                            <Skeleton className="h-5 w-20 rounded-sm" />
                            <Skeleton className="h-5 w-16 rounded-sm" />
                        </div>

                        {/* Overview */}
                        <div className="space-y-1.5 max-w-2xl">
                            <Skeleton className="h-3.5 w-full" />
                            <Skeleton className="h-3.5 w-full" />
                            <Skeleton className="h-3.5 w-2/3" />
                        </div>

                        {/* Stats — inline strip */}
                        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1.5 pt-1">
                            <div className="flex items-baseline gap-2">
                                <Skeleton className="h-2.5 w-12" />
                                <Skeleton className="h-3 w-8" />
                            </div>
                            <div className="flex items-baseline gap-2">
                                <Skeleton className="h-2.5 w-12" />
                                <Skeleton className="h-3 w-8" />
                            </div>
                            <div className="flex items-baseline gap-2">
                                <Skeleton className="h-2.5 w-12" />
                                <Skeleton className="h-3 w-10" />
                            </div>
                        </div>

                        {/* External links */}
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 sm:gap-x-4 lg:gap-x-5 pt-1">
                            <Skeleton className="h-3.5 w-16" />
                            <Skeleton className="h-3.5 w-14" />
                            <Skeleton className="h-3.5 w-16" />
                            <Skeleton className="h-3.5 w-14" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
});

export const MediaDetails = memo(function MediaDetails({ media, mediaId, type, isLoading, error }: MediaDetailsProps) {
    if (error) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="text-center space-y-3">
                    <div className="text-xs tracking-widest uppercase text-muted-foreground">Error</div>
                    <p className="text-xl font-light">Failed to load details</p>
                    <p className="text-sm text-muted-foreground">{error.message}</p>
                </div>
            </div>
        );
    }

    if (isLoading || !media) {
        return <MediaSkeleton />;
    }

    return type === "movie" ? (
        <MovieDetails media={media} mediaId={mediaId} />
    ) : (
        <ShowDetails media={media} mediaId={mediaId} />
    );
});
