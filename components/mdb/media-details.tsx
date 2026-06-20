"use client";

import { memo } from "react";
import type { TraktMedia } from "@/lib/trakt";
import { MediaHeaderSkeleton } from "./media-header";
import { MovieDetails } from "./movie-details";
import { ShowDetails } from "./show-details";

interface MediaDetailsProps {
    media?: TraktMedia;
    mediaId: string;
    type?: "movie" | "show";
    error?: Error | null;
}

export const MediaDetails = memo(function MediaDetails({ media, mediaId, type, error }: MediaDetailsProps) {
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

    // Type still resolving (external-id lookup): no layout to anchor yet.
    if (!type) {
        return <MediaHeaderSkeleton />;
    }

    // Type known: render the real layout immediately (with the #seasons anchor),
    // letting the detail component show its own skeletons until `media` arrives.
    return type === "movie" ? (
        <MovieDetails media={media} mediaId={mediaId} />
    ) : (
        <ShowDetails media={media} mediaId={mediaId} />
    );
});
