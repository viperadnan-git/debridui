"use client";

import { useParams } from "next/navigation";
import { memo, Suspense } from "react";
import { MdbFooter } from "@/components/mdb/mdb-footer";
import { MediaDetails } from "@/components/mdb/media-details";
import { useTraktMedia } from "@/hooks/use-trakt";

const MoviePage = memo(function MoviePage() {
    const params = useParams();
    const slug = params.slug as string;

    const { data, isLoading, error } = useTraktMedia(slug, "movie");

    return (
        <div className="w-full lg:px-6 max-w-6xl mx-auto">
            <Suspense fallback={null}>
                <MediaDetails media={data} mediaId={slug} type="movie" isLoading={isLoading} error={error} />
            </Suspense>
            <MdbFooter className="py-12 mt-8 border-t border-border/50" />
        </div>
    );
});

export default MoviePage;
