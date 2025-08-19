"use client";

import { MediaDetails } from "@/components/mdb/media-details";
import { useTraktMedia } from "@/hooks/use-trakt";
import { useParams } from "next/navigation";
import { memo } from "react";

const ShowPage = memo(function ShowPage() {
    const params = useParams();
    const slug = params.slug as string;

    const { data, isLoading, error } = useTraktMedia(slug, "show");

    return (
        <div className="w-full px-2 sm:px-4 lg:px-6 max-w-7xl mx-auto">
            <MediaDetails media={data} mediaId={slug} type="show" isLoading={isLoading} error={error} />
        </div>
    );
});

export default ShowPage;
