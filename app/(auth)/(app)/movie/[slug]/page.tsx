"use client";

import dynamic from "next/dynamic";
import { useTraktMedia } from "@/hooks/use-trakt";
import { useParams } from "next/navigation";
import { memo } from "react";
import { MdbFooter } from "@/components/mdb/mdb-footer";

const MediaDetails = dynamic(
    () => import("@/components/mdb/media-details").then((m) => ({ default: m.MediaDetails })),
    {
        loading: () => (
            <div className="w-full space-y-4">
                <div className="h-[35vh] bg-muted/30 animate-pulse" />
                <div className="h-24 bg-muted/30 rounded-sm animate-pulse" />
            </div>
        ),
    }
);

const MoviePage = memo(function MoviePage() {
    const params = useParams();
    const slug = params.slug as string;

    const { data, isLoading, error } = useTraktMedia(slug, "movie");

    return (
        <div className="w-full lg:px-6 max-w-6xl mx-auto">
            <MediaDetails media={data} mediaId={slug} type="movie" isLoading={isLoading} error={error} />
            <MdbFooter className="py-12 mt-8 border-t border-border/50" />
        </div>
    );
});

export default MoviePage;
