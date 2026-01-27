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
        <div className="space-y-12">
            <MediaHeader media={media} mediaId={mediaId} type="movie" />

            {media.ids?.imdb && (
                <section className="space-y-6">
                    <div className="flex items-center gap-4">
                        <div className="h-px flex-1 bg-border/50" />
                        <span className="text-xs tracking-widest uppercase text-muted-foreground">
                            Available Sources
                        </span>
                        <div className="h-px flex-1 bg-border/50" />
                    </div>
                    <div id="sources">
                        <Sources imdbId={media.ids?.imdb} mediaType="movie" mediaTitle={media.title || "Movie"} />
                    </div>
                </section>
            )}

            <section className="space-y-6">
                <div className="flex items-center gap-4">
                    <div className="h-px flex-1 bg-border/50" />
                    <span className="text-xs tracking-widest uppercase text-muted-foreground">Cast & Crew</span>
                    <div className="h-px flex-1 bg-border/50" />
                </div>
                <PeopleSection mediaId={mediaId} type="movies" />
            </section>
        </div>
    );
});
