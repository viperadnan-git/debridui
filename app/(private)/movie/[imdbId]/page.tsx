"use client";

import { MediaDetails } from "@/components/mdb/media-details";
import { useTraktMedia } from "@/hooks/use-trakt";
import { useParams } from "next/navigation";
import { memo } from "react";

const MoviePage = memo(function MoviePage() {
    const params = useParams();
    const imdbId = params.imdbId as string;

    const { data, isLoading, error } = useTraktMedia(imdbId, "movie");

    return (
        <div className="w-full px-2 sm:px-4 lg:px-6 max-w-7xl mx-auto">
            <MediaDetails
                media={data}
                mediaId={imdbId}
                type="movie"
                isLoading={isLoading}
                error={error}
            />
        </div>
    );
});

export default MoviePage;
