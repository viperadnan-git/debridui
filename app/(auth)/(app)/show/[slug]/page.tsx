"use client";

import { useTraktMedia } from "@/hooks/use-trakt";
import { useParams } from "next/navigation";
import { memo } from "react";
import { MdbFooter } from "@/components/mdb/mdb-footer";
import { MediaDetails } from "@/components/mdb/media-details";

const ShowPage = memo(function ShowPage() {
    const params = useParams();
    const slug = params.slug as string;

    const { data, isLoading, error } = useTraktMedia(slug, "show");

    return (
        <div className="w-full lg:px-6 max-w-6xl mx-auto">
            <MediaDetails media={data} mediaId={slug} type="show" isLoading={isLoading} error={error} />
            <MdbFooter className="py-12 mt-8 border-t border-border/50" />
        </div>
    );
});

export default ShowPage;
