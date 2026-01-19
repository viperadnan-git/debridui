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
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-screen -mt-6 h-[40vh] max-h-[600px]">
                <Skeleton className="w-full h-full" />
            </div>

            <div className="relative pt-[20vh] sm:pt-[22vh] md:pt-[25vh] pb-20 space-y-6">
                <div className="grid md:grid-cols-[200px_1fr] lg:grid-cols-[300px_1fr] gap-3 md:gap-6">
                    <Skeleton className="aspect-2/3 rounded-lg w-full max-w-[50vw] sm:max-w-none" />
                    <div className="space-y-4">
                        <Skeleton className="h-8 sm:h-10 w-3/4" />
                        <div className="flex gap-3 sm:gap-4">
                            <Skeleton className="h-5 sm:h-6 w-16 sm:w-20" />
                            <Skeleton className="h-5 sm:h-6 w-16 sm:w-20" />
                            <Skeleton className="h-5 sm:h-6 w-16 sm:w-20" />
                        </div>
                        <Skeleton className="h-20 sm:h-24 w-full" />
                        <div className="grid grid-cols-2 gap-3 sm:gap-4">
                            <Skeleton className="h-16 sm:h-20" />
                            <Skeleton className="h-16 sm:h-20" />
                            <Skeleton className="h-16 sm:h-20" />
                            <Skeleton className="h-16 sm:h-20" />
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
                <div className="text-center space-y-2">
                    <p className="text-2xl font-semibold">Failed to load details</p>
                    <p className="text-muted-foreground">{error.message}</p>
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
