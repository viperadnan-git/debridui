import { useQuery, useQueryClient, useQueries } from "@tanstack/react-query";
import { useMemo } from "react";
import { getUserAddons, addAddon, removeAddon, toggleAddon, updateAddonOrders } from "@/lib/actions/addons";
import { AddonClient } from "@/lib/addons/client";
import { parseStreams, catalogMetasToMediaItems } from "@/lib/addons/parser";
import {
    type Addon,
    type AddonManifest,
    type AddonSource,
    type TvSearchParams,
    hasCatalogs,
    hasStreams,
} from "@/lib/addons/types";
import { useToastMutation } from "@/lib/utils/mutation-factory";

const USER_ADDONS_KEY = ["user-addons"];

/**
 * Fetch all user addons from database
 */
export function useUserAddons(enabled = true) {
    return useQuery({
        queryKey: USER_ADDONS_KEY,
        queryFn: getUserAddons,
        enabled,
        staleTime: 1 * 60 * 60 * 1000, // 1 hour
    });
}

/**
 * Add a new addon
 */
export function useAddAddon() {
    const queryClient = useQueryClient();

    return useToastMutation(
        (addon: Omit<Addon, "id" | "order">) => addAddon(addon),
        { error: "Failed to add addon" },
        {
            onSuccess: (newAddon) => {
                queryClient.setQueryData<Addon[]>(USER_ADDONS_KEY, (old = []) => [...old, newAddon]);
            },
        }
    );
}

/**
 * Remove an addon with optimistic update
 */
export function useRemoveAddon() {
    const queryClient = useQueryClient();

    return useToastMutation<{ success: boolean }, string, { previousAddons: Addon[] | undefined }>(
        (addonId) => removeAddon(addonId),
        { error: "Failed to remove addon" },
        {
            onMutate: async (addonId) => {
                await queryClient.cancelQueries({ queryKey: USER_ADDONS_KEY });

                const previousAddons = queryClient.getQueryData<Addon[]>(USER_ADDONS_KEY);

                queryClient.setQueryData<Addon[]>(USER_ADDONS_KEY, (old = []) =>
                    old.filter((addon) => addon.id !== addonId)
                );

                return { previousAddons };
            },
            onError: (_error, _variables, context) => {
                if (context?.previousAddons) {
                    queryClient.setQueryData(USER_ADDONS_KEY, context.previousAddons);
                }
            },
            onSettled: (_, __, addonId) => {
                queryClient.invalidateQueries({ queryKey: ["addon", addonId] });
                queryClient.invalidateQueries({ queryKey: USER_ADDONS_KEY });
            },
        }
    );
}

/**
 * Toggle addon enabled status
 */
export function useToggleAddon() {
    const queryClient = useQueryClient();

    return useToastMutation<
        { success: boolean },
        { addonId: string; enabled: boolean },
        { previousAddons: Addon[] | undefined }
    >(
        ({ addonId, enabled }) => toggleAddon(addonId, enabled),
        { error: "Failed to toggle addon" },
        {
            onMutate: async ({ addonId, enabled }) => {
                await queryClient.cancelQueries({ queryKey: USER_ADDONS_KEY });

                const previousAddons = queryClient.getQueryData<Addon[]>(USER_ADDONS_KEY);

                queryClient.setQueryData<Addon[]>(USER_ADDONS_KEY, (old = []) => {
                    return old.map((addon) => (addon.id === addonId ? { ...addon, enabled } : addon));
                });

                return { previousAddons };
            },
            onError: (_error, _variables, context) => {
                if (context?.previousAddons) {
                    queryClient.setQueryData(USER_ADDONS_KEY, context.previousAddons);
                }
            },
            onSettled: () => queryClient.invalidateQueries({ queryKey: USER_ADDONS_KEY }),
        }
    );
}

/**
 * Update addon orders (for reordering)
 */
export function useUpdateAddonOrders() {
    const queryClient = useQueryClient();

    return useToastMutation<
        { success: boolean },
        Array<{ id: string; order: number }>,
        { previousAddons: Addon[] | undefined }
    >(
        updateAddonOrders,
        { error: "Failed to reorder addons" },
        {
            onMutate: async (updates) => {
                await queryClient.cancelQueries({ queryKey: USER_ADDONS_KEY });

                const previousAddons = queryClient.getQueryData<Addon[]>(USER_ADDONS_KEY);

                queryClient.setQueryData<Addon[]>(USER_ADDONS_KEY, (old = []) => {
                    const updated = [...old];
                    updates.forEach(({ id, order }) => {
                        const addon = updated.find((a) => a.id === id);
                        if (addon) addon.order = order;
                    });
                    return updated.sort((a, b) => a.order - b.order);
                });

                return { previousAddons };
            },
            onError: (_error, _variables, context) => {
                if (context?.previousAddons) {
                    queryClient.setQueryData(USER_ADDONS_KEY, context.previousAddons);
                }
            },
            onSettled: () => queryClient.invalidateQueries({ queryKey: USER_ADDONS_KEY }),
        }
    );
}

/**
 * Shared manifest query config. Used by useAddon, useAddonCatalogDefs,
 * useStreamAddons, and imperatively via queryClient.ensureQueryData in streaming store.
 */
export function manifestQueryOptions(addon: { id: string; url: string }) {
    return {
        queryKey: ["addon", addon.id, "manifest"] as const,
        queryFn: () => new AddonClient({ url: addon.url }).fetchManifest(),
        staleTime: 24 * 60 * 60 * 1000, // 24 hours
    };
}

interface UseAddonOptions {
    addonId: string;
    url: string;
    enabled?: boolean;
}

/**
 * Hook to fetch and cache addon manifest
 */
export function useAddon({ addonId, url, enabled = true }: UseAddonOptions) {
    return useQuery({
        ...manifestQueryOptions({ id: addonId, url }),
        enabled,
    });
}

/**
 * Returns enabled addons that support streams, filtered via manifest capability check.
 * Manifests are fetched in parallel and share cache with all other manifest consumers.
 */
export function useStreamAddons() {
    const { data: addons = [], isPending: isAddonsLoading } = useUserAddons();

    const enabledAddons = useMemo(() => addons.filter((a) => a.enabled).sort((a, b) => a.order - b.order), [addons]);

    const manifests = useQueries({
        queries: enabledAddons.map((addon) => manifestQueryOptions(addon)),
    });

    // rerender-dependencies: stable primitive key
    const manifestDataKey = manifests.map((q) => q.dataUpdatedAt).join(",");

    const streamAddons = useMemo(() => {
        return enabledAddons.filter((_, i) => {
            const manifest = manifests[i].data;
            return manifest && hasStreams(manifest);
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [manifestDataKey, enabledAddons]);

    return {
        addons: streamAddons,
        isLoading: isAddonsLoading || manifests.some((q) => q.isPending),
    };
}

/**
 * Imperative manifest filter for non-hook contexts (e.g. streaming store).
 * Uses queryClient.ensureQueryData for cache-first fetching in parallel.
 */
export async function getStreamCapableAddons(
    addons: Addon[],
    qc: {
        ensureQueryData: <T>(opts: {
            queryKey: readonly unknown[];
            queryFn: () => Promise<T>;
            staleTime: number;
        }) => Promise<T>;
    }
): Promise<Addon[]> {
    const manifests = await Promise.all(addons.map((a) => qc.ensureQueryData(manifestQueryOptions(a))));
    return addons.filter((_, i) => hasStreams(manifests[i] as AddonManifest));
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
 * Hook to fetch sources from stream-capable addons only.
 * Filters via manifest capability check before issuing stream requests.
 *
 * - async-parallel: Each addon has its own query, results show as they arrive
 * - client-swr-dedup: Individual addon queries are cached separately
 */
export function useAddonSources({ imdbId, mediaType, tvParams }: UseAddonSourcesOptions) {
    const { addons: enabledAddons, isLoading: isAddonsLoading } = useStreamAddons();

    // Individual query per addon for progressive loading
    const queries = useQueries({
        queries: enabledAddons.map((addon) => ({
            queryKey: ["addon", addon.id, "sources", imdbId, mediaType, tvParams] as const,
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

    // Loading state: true if addons or ANY source query is still loading
    const isLoading = isAddonsLoading || queries.some((q) => q.isLoading);

    return {
        data: combinedData,
        isLoading,
        failedAddons,
    };
}

export interface AddonCatalogDef {
    type: string;
    id: string;
    name: string;
    addonId: string;
    addonName: string;
    addonUrl: string;
}

/**
 * Returns browsable catalog definitions from enabled addon manifests (lightweight)
 *
 * - async-parallel: All manifests fetched independently via useQueries
 * - client-swr-dedup: Manifest queries share cache with addon cards (same key)
 */
export function useAddonCatalogDefs() {
    const { data: addons = [], isPending: isAddonsLoading } = useUserAddons();

    const enabledAddons = useMemo(() => addons.filter((a) => a.enabled).sort((a, b) => a.order - b.order), [addons]);

    // Fetch manifests in parallel (shares cache with useAddon hook)
    const manifests = useQueries({
        queries: enabledAddons.map((addon) => manifestQueryOptions(addon)),
    });

    // rerender-dependencies: derive stable primitive key from query results
    const manifestDataKey = manifests.map((q) => q.dataUpdatedAt).join(",");

    // Extract browsable catalogs from addons with catalog capability
    const catalogs = useMemo<AddonCatalogDef[]>(() => {
        return manifests.flatMap((q, i) => {
            if (!q.data || !hasCatalogs(q.data)) return [];
            return (q.data.catalogs ?? [])
                .filter((c) => !c.extra?.some((e) => e.name === "search" && e.isRequired))
                .map((c) => ({
                    ...c,
                    name: c.name || c.id,
                    addonId: enabledAddons[i].id,
                    addonName: enabledAddons[i].name,
                    addonUrl: enabledAddons[i].url,
                }));
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [manifestDataKey, enabledAddons]);

    return {
        catalogs,
        isLoading: isAddonsLoading || manifests.some((q) => q.isPending),
    };
}

/**
 * Fetches a single catalog's content. Use `enabled` to defer until visible.
 */
export function useAddonCatalog(catalog: AddonCatalogDef, enabled = true) {
    return useQuery({
        queryKey: ["addon", catalog.addonId, "catalog", catalog.type, catalog.id],
        queryFn: async () => {
            const client = new AddonClient({ url: catalog.addonUrl });
            const response = await client.fetchCatalog(catalog.type, catalog.id);
            return {
                items: catalogMetasToMediaItems(response.metas),
            };
        },
        enabled,
        staleTime: 30 * 60 * 1000,
        retry: 1,
        refetchOnWindowFocus: false,
    });
}

/**
 * Resolve a single catalog definition by fetching only the relevant addon's manifest.
 * Shares cache with useAddon/useAddonCatalogDefs via the same query key.
 */
export function useAddonCatalogDef(addonId: string, type: string, catalogId: string) {
    const { data: addons = [], isPending: isAddonsLoading } = useUserAddons();

    const addon = useMemo(() => addons.find((a) => a.id === addonId && a.enabled), [addons, addonId]);

    const { data: manifest, isPending: isManifestLoading } = useAddon({
        addonId,
        url: addon?.url ?? "",
        enabled: !!addon,
    });

    const catalogDef = useMemo<AddonCatalogDef | undefined>(() => {
        if (!addon || !manifest || !hasCatalogs(manifest)) return undefined;
        const cat = (manifest.catalogs ?? []).find((c) => c.type === type && c.id === catalogId);
        if (!cat) return undefined;
        return {
            ...cat,
            name: cat.name || cat.id,
            addonId: addon.id,
            addonName: addon.name,
            addonUrl: addon.url,
        };
    }, [manifest, type, catalogId, addon]);

    return {
        catalogDef,
        isLoading: isAddonsLoading || (!!addon && isManifestLoading),
    };
}

export function catalogSlug(catalog: AddonCatalogDef): string {
    return `${catalog.addonId}~${catalog.type}~${catalog.id}`;
}

export function parseCatalogSlug(slug: string) {
    const parts = decodeURIComponent(slug).split("~");
    if (parts.length !== 3 || parts.some((p) => !p)) {
        return { addonId: "", type: "", id: "" };
    }
    return { addonId: parts[0], type: parts[1], id: parts[2] };
}
