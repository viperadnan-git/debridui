import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { z } from "zod";
import {
    clearSearchHistory,
    getSearchHistory,
    recordSearchPick,
    removeFromSearchHistory,
} from "@/lib/actions/search-history";
import type { SearchHistory } from "@/lib/db/schema";
import type { clearSearchHistorySchema, recordSearchPickSchema, removeSearchPickSchema } from "@/lib/schemas";

const SEARCH_HISTORY_KEY = ["search-history"];

/** Fetch the user's search history (newest first). */
export function useSearchHistory(provider?: string) {
    return useQuery({
        queryKey: provider ? [...SEARCH_HISTORY_KEY, provider] : SEARCH_HISTORY_KEY,
        queryFn: () => getSearchHistory(provider),
        staleTime: 1000 * 60, // 1 minute
        refetchOnWindowFocus: true,
    });
}

/** Record a search pick — fire-and-forget from the click handler. */
export function useRecordSearchPick() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (input: z.infer<typeof recordSearchPickSchema>) => recordSearchPick(input),
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: SEARCH_HISTORY_KEY });
        },
    });
}

/** Remove a single entry. */
export function useRemoveFromSearchHistory() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (input: z.infer<typeof removeSearchPickSchema>) => removeFromSearchHistory(input),
        onMutate: async (variables) => {
            await queryClient.cancelQueries({ queryKey: SEARCH_HISTORY_KEY });
            const previousHistory = queryClient.getQueryData(SEARCH_HISTORY_KEY);

            queryClient.setQueryData(SEARCH_HISTORY_KEY, (old: SearchHistory[] | undefined) => {
                if (!old) return old;
                return old.filter(
                    (entry) => !(entry.provider === variables.provider && entry.providerId === variables.providerId)
                );
            });

            return { previousHistory };
        },
        onError: (_error, _variables, context) => {
            if (context?.previousHistory) {
                queryClient.setQueryData(SEARCH_HISTORY_KEY, context.previousHistory);
            }
            toast.error("Failed to remove entry");
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: SEARCH_HISTORY_KEY });
        },
    });
}

/** Clear all search history (optionally scoped to one provider). */
export function useClearSearchHistory() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (input?: z.infer<typeof clearSearchHistorySchema>) => clearSearchHistory(input),
        onMutate: async () => {
            await queryClient.cancelQueries({ queryKey: SEARCH_HISTORY_KEY });
            const previousHistory = queryClient.getQueryData(SEARCH_HISTORY_KEY);
            queryClient.setQueryData(SEARCH_HISTORY_KEY, []);
            return { previousHistory };
        },
        onError: (error, _variables, context) => {
            if (context?.previousHistory) {
                queryClient.setQueryData(SEARCH_HISTORY_KEY, context.previousHistory);
            }
            toast.error("Failed to clear history");
            console.error(error);
        },
        onSuccess: () => {
            toast.success("Search history cleared");
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: SEARCH_HISTORY_KEY });
        },
    });
}
