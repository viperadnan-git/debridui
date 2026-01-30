import { useQuery, useQueryClient, useQueries } from "@tanstack/react-query";
import { useMemo } from "react";
import { getUserAddons, addAddon, removeAddon, toggleAddon, updateAddonOrders } from "@/lib/actions/addons";
import { AddonClient } from "@/lib/addons/client";
import { parseStreams } from "@/lib/addons/parser";
import { type Addon, type AddonSource, type TvSearchParams } from "@/lib/addons/types";
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
        queryKey: ["addon", addonId, "manifest"],
        queryFn: async () => {
            const client = new AddonClient({ url });
            return await client.fetchManifest();
        },
        enabled,
        staleTime: 1000 * 60 * 60 * 24, // 24 hours
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
    const { data: addons = [] } = useUserAddons();

    // Stable reference for enabled addons list
    const enabledAddons = useMemo(() => addons.filter((a) => a.enabled).sort((a, b) => a.order - b.order), [addons]);

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

    // Loading state: true if ANY query is still loading
    const isLoading = queries.some((q) => q.isLoading);

    return {
        data: combinedData,
        isLoading,
        failedAddons,
    };
}
