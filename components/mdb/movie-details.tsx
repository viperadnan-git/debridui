"use client";

import { type TraktMedia } from "@/lib/trakt";
import { PeopleSection } from "./people-section";
import { Sources } from "./sources";
import { MediaHeader } from "./media-header";
import { SectionDivider } from "@/components/section-divider";
import { memo } from "react";

interface MovieDetailsProps {
    media: TraktMedia;
    mediaId: string;
}

export const MovieDetails = memo(function MovieDetails({ media, mediaId }: MovieDetailsProps) {
    return (
        <div className="space-y-12">
            <MediaHeader media={media} mediaId={mediaId} type="movie" />

            {media.ids?.imdb && (
                <section className="space-y-6">
                    <SectionDivider label="Available Sources" />
                    <div id="sources">
                        <Sources imdbId={media.ids?.imdb} mediaType="movie" mediaTitle={media.title || "Movie"} />
                    </div>
                </section>
            )}

            <section className="space-y-6">
                <SectionDivider label="Cast & Crew" />
                <PeopleSection mediaId={mediaId} type="movies" />
            </section>
        </div>
    );
});
