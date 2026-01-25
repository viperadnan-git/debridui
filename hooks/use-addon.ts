import { useQueries, useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { AddonClient } from "@/lib/addons/client";
import { parseStreams } from "@/lib/addons/parser";
import { useAddonsStore } from "@/lib/stores/addons";
import { type AddonSource, type TvSearchParams } from "@/lib/addons/types";

interface UseAddonOptions {
    url: string;
    enabled?: boolean;
}

/**
 * Hook to fetch and cache addon manifest
 */
export function useAddon({ url, enabled = true }: UseAddonOptions) {
    return useQuery({
        queryKey: ["addon-manifest", url],
        queryFn: async () => {
            const client = new AddonClient({ url });
            return await client.fetchManifest();
        },
        enabled,
        staleTime: 1000 * 60 * 60 * 24, // 24 hours
        gcTime: 1000 * 60 * 60 * 24 * 7, // 7 days
    });
}

interface UseAddonSourcesOptions {
    imdbId: string;
    mediaType: "movie" | "show";
    tvParams?: TvSearchParams;
}

/**
 * Fetch sources from a single addon
 */
async function fetchAddonSources(
    addon: { id: string; name: string; url: string },
    imdbId: string,
    mediaType: "movie" | "show",
    tvParams?: TvSearchParams
): Promise<AddonSource[]> {
    const client = new AddonClient({ url: addon.url });
    const response = await client.fetchStreams(imdbId, mediaType, tvParams);
    return parseStreams(response.streams, addon.id, addon.name);
}

/**
 * Hook to fetch sources from all enabled addons
 *
 * Following Vercel React best practices:
 * - async-parallel: Each addon has its own query, results show as they arrive
 * - client-swr-dedup: Individual addon queries are cached separately
 * - rerender-dependencies: Uses primitive dependencies (addon IDs)
 */
export function useAddonSources({ imdbId, mediaType, tvParams }: UseAddonSourcesOptions) {
    const addons = useAddonsStore((state) => state.addons);

    // Stable reference for enabled addons list
    const enabledAddons = useMemo(() => addons.filter((a) => a.enabled).sort((a, b) => a.order - b.order), [addons]);

    // Individual query per addon for progressive loading
    const queries = useQueries({
        queries: enabledAddons.map((addon) => ({
            queryKey: ["addon-sources", addon.id, imdbId, mediaType, tvParams] as const,
            queryFn: () => fetchAddonSources(addon, imdbId, mediaType, tvParams),
            staleTime: 5 * 60 * 1000, // 5 minutes
            gcTime: 24 * 60 * 60 * 1000, // 24 hours
            retry: 1,
            retryDelay: 1000,
            refetchOnWindowFocus: false,
            refetchOnReconnect: false,
        })),
    });

    // Progressive data combination - updates as each addon responds
    const combinedData = useMemo(() => {
        const allSources: AddonSource[] = [];

        for (const query of queries) {
            if (query.data) {
                allSources.push(...query.data);
            }
        }

        // Sort: cached first
        return allSources.sort((a, b) => {
            if (a.isCached && !b.isCached) return -1;
            if (!a.isCached && b.isCached) return 1;
            return 0;
        });
    }, [queries]);

    // Track failed addons
    const failedAddons = useMemo(() => {
        return queries
            .map((query, index) => ({
                query,
                addon: enabledAddons[index],
            }))
            .filter(({ query }) => query.isError)
            .map(({ addon }) => addon.name);
    }, [queries, enabledAddons]);

    // Loading state: true if ANY query is still loading
    const isLoading = queries.some((q) => q.isLoading);

    return {
        data: combinedData,
        isLoading,
        failedAddons,
    };
}
