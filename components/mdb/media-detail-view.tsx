"use client";

import { Suspense } from "react";
import { MdbFooter } from "@/components/mdb/mdb-footer";
import { MediaDetails } from "@/components/mdb/media-details";
import { useTraktMedia } from "@/hooks/use-trakt";
import type { TraktIdType } from "@/lib/trakt";

interface MediaDetailViewProps {
    id: string;
    type?: "movie" | "show";
    idType?: TraktIdType;
}

// Shared detail page body for all media routes (/movies, /shows, /title).
export function MediaDetailView({ id, type, idType }: MediaDetailViewProps) {
    const { media, type: resolvedType, error } = useTraktMedia({ id, type, idType });

    return (
        <div className="w-full lg:px-6 max-w-6xl mx-auto">
            <Suspense fallback={null}>
                <MediaDetails media={media} mediaId={id} type={resolvedType} error={error} />
            </Suspense>
            <MdbFooter className="py-12 mt-8 border-t border-border/50" />
        </div>
    );
}
