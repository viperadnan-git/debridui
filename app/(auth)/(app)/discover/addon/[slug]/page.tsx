"use client";

import { useParams, useRouter } from "next/navigation";
import { memo, useCallback } from "react";
import { ArrowLeft, Film, Tv, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { MediaCard } from "@/components/mdb/media-card";
import { useAddonCatalogDef, useAddonCatalog, parseCatalogSlug, type AddonCatalogDef } from "@/hooks/use-addons";

// rerender-memo-with-default-value: hoisted constant avoids new object per render
const EMPTY_CATALOG: AddonCatalogDef = { addonId: "", type: "", id: "", name: "", addonName: "", addonUrl: "" };

const DiscoverAddonPage = memo(function DiscoverAddonPage() {
    const router = useRouter();
    const { slug } = useParams<{ slug: string }>();
    const { addonId, type, id } = parseCatalogSlug(slug);
    const goBack = useCallback(() => router.back(), [router]);

    const { catalogDef, isLoading: isDefLoading } = useAddonCatalogDef(addonId, type, id);

    const { data, error } = useAddonCatalog(catalogDef ?? EMPTY_CATALOG, !!catalogDef);

    const isLoading = isDefLoading || (!data && !error && !!catalogDef);

    return (
        <div className="lg:px-6 pb-12">
            {/* Header */}
            <div className="space-y-3 mb-8">
                <button
                    onClick={goBack}
                    className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                    <ArrowLeft className="size-3" />
                    <span>Back</span>
                </button>
                <div className="flex items-center gap-3">
                    {type === "movie" ? (
                        <Film className="size-5 text-primary shrink-0" strokeWidth={1.5} />
                    ) : (
                        <Tv className="size-5 text-primary shrink-0" strokeWidth={1.5} />
                    )}
                    {isDefLoading ? (
                        <Skeleton className="h-8 w-48" />
                    ) : (
                        <h1 className="text-2xl md:text-3xl font-light truncate">{catalogDef?.name ?? id}</h1>
                    )}
                </div>
                {isDefLoading ? (
                    <Skeleton className="h-3 w-32" />
                ) : catalogDef ? (
                    <p className="text-xs text-muted-foreground">
                        {catalogDef.addonName} <span className="text-border">·</span> {type}
                    </p>
                ) : null}
            </div>

            {/* Error */}
            {error && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-16">
                    <AlertCircle className="size-4" />
                    <span>Failed to load catalog</span>
                </div>
            )}

            {/* Loading skeleton */}
            {isLoading && (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3">
                    {Array.from({ length: 21 }, (_, i) => (
                        <div key={i} className="animate-pulse" style={{ animationDelay: `${i * 30}ms` }}>
                            <Skeleton className="aspect-2/3 rounded-sm" />
                        </div>
                    ))}
                </div>
            )}

            {/* Items grid — rendering-content-visibility for large catalogs */}
            {data && !error && (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3">
                    {data.items.map((item, index) => {
                        const media = item.movie || item.show;
                        if (!media) return null;
                        const mediaType = item.movie ? "movie" : "show";

                        return (
                            <MediaCard
                                key={`${mediaType}-${media.ids?.imdb || media.ids?.slug || index}`}
                                media={media}
                                type={mediaType}
                            />
                        );
                    })}
                </div>
            )}

            {/* Not found */}
            {!isDefLoading && !catalogDef && !isLoading && (
                <div className="text-sm text-muted-foreground py-16 text-center">
                    Catalog not found. The addon may no longer be installed.
                </div>
            )}
        </div>
    );
});

export default DiscoverAddonPage;
