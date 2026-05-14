"use client";

import { AlertCircle, Film, Tv } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { memo, useCallback } from "react";
import { MediaCard } from "@/components/mdb/media-card";
import { PageHeader } from "@/components/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { type AddonCatalogDef, parseCatalogSlug, useAddonCatalog, useAddonCatalogDef } from "@/hooks/use-addons";

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

    const TypeIcon = type === "movie" ? Film : Tv;

    return (
        <div className="lg:px-6 pb-12 space-y-4 sm:space-y-6 lg:space-y-8">
            <PageHeader
                back={{ onClick: goBack }}
                icon={TypeIcon}
                title={isDefLoading ? <Skeleton className="h-7 sm:h-8 w-48" /> : (catalogDef?.name ?? id)}
                meta={
                    isDefLoading
                        ? [<Skeleton key="m" className="h-3 w-32" />]
                        : catalogDef
                          ? [
                                catalogDef.addonName,
                                <span key="t" className="capitalize">
                                    {type}
                                </span>,
                            ]
                          : undefined
                }
            />

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
                        // biome-ignore lint/suspicious/noArrayIndexKey: position-based key in static placeholder list
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
