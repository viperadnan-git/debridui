"use client";

import { type TraktMedia } from "@/lib/trakt";
import { PeopleSection } from "./people-section";
import { Sources } from "./sources";
import { MediaHeader } from "./media-header";
import { memo } from "react";

interface MovieDetailsProps {
    media: TraktMedia;
    mediaId: string;
}

export const MovieDetails = memo(function MovieDetails({ media, mediaId }: MovieDetailsProps) {
    return (
        <div className="flex flex-col gap-8">
            <MediaHeader media={media} mediaId={mediaId} type="movie" />

            {media.ids?.imdb && (
                <div className="space-y-4">
                    <h2 className="text-lg sm:text-xl font-bold" id="sources">
                        Available Sources
                    </h2>
                    <Sources imdbId={media.ids.imdb} mediaType="movie" mediaTitle={media.title || "Movie"} />
                </div>
            )}

            <PeopleSection mediaId={mediaId} type="movies" />
        </div>
    );
});
