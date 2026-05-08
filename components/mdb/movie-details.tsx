"use client";

import { memo } from "react";
import { SectionDivider } from "@/components/section-divider";
import type { TraktMedia } from "@/lib/trakt";
import { MediaHeader } from "./media-header";
import { PeopleSection } from "./people-section";
import { Sources } from "./sources";

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
                        <Sources request={{ imdbId: media.ids?.imdb || "", type: "movie", media }} />
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
