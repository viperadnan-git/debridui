import { getUserSettings, saveUserSettings } from "@/lib/actions/settings";
import type { ServerSettings } from "@/lib/types";
import { useSettingsStore } from "@/lib/stores/settings";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const USER_SETTINGS_KEY = ["user-settings"];

/**
 * Hydrate Zustand store from server settings.
 * Add new mappings here when persisting more settings server-side.
 */
export function hydrateSettingsFromServer(settings: ServerSettings | null) {
    if (!settings) return;
    const { set } = useSettingsStore.getState();
    if (settings.tmdb_api_key !== undefined) set("tmdbApiKey", settings.tmdb_api_key);
}

export function useUserSettings(enabled = true) {
    return useQuery({
        queryKey: USER_SETTINGS_KEY,
        queryFn: () => getUserSettings(),
        enabled,
        staleTime: 1 * 60 * 60 * 1000, // 1 hour
        refetchOnWindowFocus: false,
    });
}

export function useSaveUserSettings() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (settings: Partial<ServerSettings>) => saveUserSettings(settings),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: USER_SETTINGS_KEY });
        },
    });
}
