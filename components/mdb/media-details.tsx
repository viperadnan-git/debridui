"use client";

import { type TraktMedia } from "@/lib/trakt";
import { Skeleton } from "@/components/ui/skeleton";
import { MovieDetails } from "./movie-details";
import { ShowDetails } from "./show-details";
import { memo } from "react";

interface MediaDetailsProps {
    media?: TraktMedia;
    mediaId: string;
    type: "movie" | "show";
    isLoading?: boolean;
    error?: Error | null;
}

const MediaSkeleton = memo(function MediaSkeleton() {
    return (
        <div className="relative min-h-screen">
            {/* Backdrop skeleton */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-screen -mt-6 h-[25vh] sm:h-[32vh] md:h-[40vh]">
                <Skeleton className="w-full h-full rounded-none" />
            </div>

            <div className="relative pt-[12vh] sm:pt-[20vh] md:pt-[30vh] pb-8">
                <div className="grid md:grid-cols-[180px_1fr] lg:grid-cols-[240px_1fr] gap-6 md:gap-8">
                    {/* Poster */}
                    <div className="space-y-4">
                        <Skeleton className="aspect-2/3 rounded-sm max-md:max-w-[45vw]" />
                        <Skeleton className="h-10 w-full hidden md:block" />
                    </div>

                    {/* Content */}
                    <div className="space-y-6">
                        <div className="space-y-3">
                            <Skeleton className="h-3 w-16" />
                            <Skeleton className="h-10 sm:h-12 w-3/4" />
                        </div>
                        <div className="flex gap-3">
                            <Skeleton className="h-5 w-12" />
                            <Skeleton className="h-5 w-16" />
                            <Skeleton className="h-5 w-14" />
                        </div>
                        <div className="flex gap-2">
                            <Skeleton className="h-6 w-16 rounded-sm" />
                            <Skeleton className="h-6 w-20 rounded-sm" />
                            <Skeleton className="h-6 w-14 rounded-sm" />
                        </div>
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-full max-w-2xl" />
                            <Skeleton className="h-4 w-full max-w-xl" />
                            <Skeleton className="h-4 w-3/4 max-w-lg" />
                        </div>
                        <div className="flex gap-6 pt-2">
                            <div className="space-y-1">
                                <Skeleton className="h-3 w-12" />
                                <Skeleton className="h-4 w-8" />
                            </div>
                            <div className="space-y-1">
                                <Skeleton className="h-3 w-12" />
                                <Skeleton className="h-4 w-8" />
                            </div>
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
