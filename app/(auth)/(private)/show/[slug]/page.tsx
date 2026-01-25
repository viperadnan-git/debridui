"use client";

import dynamic from "next/dynamic";
import { useTraktMedia } from "@/hooks/use-trakt";
import { useParams } from "next/navigation";
import { memo } from "react";
import { MdbFooter } from "@/components/mdb/mdb-footer";

// Dynamic import for MediaDetails to reduce initial bundle size (~345 lines)
const MediaDetails = dynamic(
    () => import("@/components/mdb/media-details").then((m) => ({ default: m.MediaDetails })),
    {
        loading: () => (
            <div className="w-full space-y-4">
                <div className="h-96 bg-muted/50 rounded animate-pulse" />
                <div className="h-24 bg-muted/50 rounded animate-pulse" />
            </div>
        ),
    }
);

const ShowPage = memo(function ShowPage() {
    const params = useParams();
    const slug = params.slug as string;

    const { data, isLoading, error } = useTraktMedia(slug, "show");

    return (
        <div className="w-full px-2 sm:px-4 lg:px-6 max-w-7xl mx-auto space-y-8">
            <MediaDetails media={data} mediaId={slug} type="show" isLoading={isLoading} error={error} />
            <MdbFooter className="pb-8" />
        </div>
    );
});

export default ShowPage;
