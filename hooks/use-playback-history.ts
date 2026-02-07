import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getPlaybackHistory, removeFromPlaybackHistory, clearPlaybackHistory } from "@/lib/actions/playback-history";
import { toast } from "sonner";
import { type z } from "zod";
import { type removePlaybackSchema } from "@/lib/schemas";
import { type PlaybackHistory } from "@/lib/db/schema";

const PLAYBACK_HISTORY_KEY = ["playback-history"];

/**
 * Fetch user's playback history
 */
export function usePlaybackHistory() {
    return useQuery({
        queryKey: PLAYBACK_HISTORY_KEY,
        queryFn: getPlaybackHistory,
        staleTime: 1000 * 60, // 1 minute
        refetchOnWindowFocus: true,
    });
}

/**
 * Remove entry from playback history
 */
export function useRemoveFromPlaybackHistory() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (input: z.infer<typeof removePlaybackSchema>) => removeFromPlaybackHistory(input),
        onMutate: async (variables) => {
            await queryClient.cancelQueries({ queryKey: PLAYBACK_HISTORY_KEY });

            const previousHistory = queryClient.getQueryData(PLAYBACK_HISTORY_KEY);

            // Optimistically remove
            queryClient.setQueryData(PLAYBACK_HISTORY_KEY, (old: PlaybackHistory[]) => {
                if (!old) return old;
                return old.filter((entry) => entry.imdbId !== variables.imdbId);
            });

            return { previousHistory };
        },
        onError: (error, _variables, context) => {
            if (context?.previousHistory) {
                queryClient.setQueryData(PLAYBACK_HISTORY_KEY, context.previousHistory);
            }
            toast.error("Failed to remove entry");
            console.error(error);
        },
        onSuccess: () => {
            toast.success("Removed from Continue Watching");
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: PLAYBACK_HISTORY_KEY });
        },
    });
}

/**
 * Clear all playback history
 */
export function useClearPlaybackHistory() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: clearPlaybackHistory,
        onMutate: async () => {
            await queryClient.cancelQueries({ queryKey: PLAYBACK_HISTORY_KEY });
            const previousHistory = queryClient.getQueryData(PLAYBACK_HISTORY_KEY);

            // Optimistically clear
            queryClient.setQueryData(PLAYBACK_HISTORY_KEY, []);

            return { previousHistory };
        },
        onError: (error, _variables, context) => {
            if (context?.previousHistory) {
                queryClient.setQueryData(PLAYBACK_HISTORY_KEY, context.previousHistory);
            }
            toast.error("Failed to clear history");
            console.error(error);
        },
        onSuccess: () => {
            toast.success("Playback history cleared");
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: PLAYBACK_HISTORY_KEY });
        },
    });
}
