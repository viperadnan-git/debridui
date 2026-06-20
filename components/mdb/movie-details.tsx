"use client";

import { memo } from "react";
import { SectionDivider } from "@/components/section-divider";
import type { TraktMedia } from "@/lib/trakt";
import { MediaHeader, MediaHeaderSkeleton } from "./media-header";
import { PeopleSection } from "./people-section";
import { Sources } from "./sources";

interface MovieDetailsProps {
    media?: TraktMedia;
    mediaId: string;
}

export const MovieDetails = memo(function MovieDetails({ media, mediaId }: MovieDetailsProps) {
    return (
        <div className="space-y-12">
            {media ? <MediaHeader media={media} mediaId={mediaId} type="movie" /> : <MediaHeaderSkeleton />}

            {media?.ids?.imdb && (
                <section className="space-y-6">
                    <SectionDivider label="Available Sources" />
                    <div id="sources" className="-mx-4 sm:mx-0">
                        <Sources
                            request={{ imdbId: media.ids.imdb, type: "movie", media }}
                            className="border-x-0 sm:border-x rounded-none sm:rounded-sm"
                        />
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
