import { create } from "zustand";
import { type Addon, type AddonSource, type TvSearchParams } from "@/lib/addons/types";
import { AddonClient } from "@/lib/addons/client";
import { parseStreams } from "@/lib/addons/parser";
import { selectBestSource } from "@/lib/streaming/source-selector";
import { queryClient } from "@/lib/query-client";
import { toast } from "sonner";
import { FileType, MediaPlayer } from "@/lib/types";
import { openInPlayer } from "@/lib/utils/media-player";
import { useSettingsStore } from "./settings";
import { usePreviewStore } from "./preview";

export interface StreamingRequest {
    imdbId: string;
    type: "movie" | "show";
    title: string;
    tvParams?: TvSearchParams;
}

interface StreamingState {
    activeRequest: StreamingRequest | null;
    selectedSource: AddonSource | null;

    play: (request: StreamingRequest, addons: Addon[]) => Promise<void>;
    playSource: (source: AddonSource, title: string) => void;
    cancel: () => void;
}

// Module-level state for request cancellation and toast timing
let toastId: string | number | null = null;
let toastCreatedAt = 0;
let requestId = 0;

// Minimum time toast must be visible before dismissing (allows mount animation)
const MIN_TOAST_DURATION = 300;
const TOAST_POSITION = "bottom-center" as const;

function dismissToast() {
    if (!toastId) return;

    const elapsed = Date.now() - toastCreatedAt;
    const id = toastId;
    toastId = null;

    if (elapsed < MIN_TOAST_DURATION) {
        setTimeout(() => toast.dismiss(id), MIN_TOAST_DURATION - elapsed);
    } else {
        toast.dismiss(id);
    }
}

interface ShowSourceToastParams {
    source: AddonSource;
    title: string;
    isCached: boolean;
    autoPlay: boolean;
    allowUncached: boolean;
    onPlay: () => void;
}

function showSourceToast({ source, title, isCached, autoPlay, allowUncached, onPlay }: ShowSourceToastParams) {
    if (autoPlay && (isCached || allowUncached)) {
        dismissToast();
        onPlay();
        return;
    }

    const meta = [source.resolution, source.quality, source.size].filter(Boolean).join(" · ");
    const cacheStatus = isCached ? "Cached" : "Not cached";
    const description = `${meta} · ${cacheStatus}`.replace(/^ · /, "");

    if (isCached || allowUncached) {
        toast.success(title, {
            id: toastId ?? undefined,
            position: TOAST_POSITION,
            description,
            action: { label: "Play", onClick: onPlay },
            duration: Infinity,
        });
    } else {
        toast.warning(title, {
            id: toastId ?? undefined,
            position: TOAST_POSITION,
            description,
            action: { label: "Play Anyway", onClick: onPlay },
            duration: Infinity,
        });
    }
}

export const useStreamingStore = create<StreamingState>()((set, get) => ({
    activeRequest: null,
    selectedSource: null,

    playSource: (source, title) => {
        if (!source.url) return;

        const mediaPlayer = useSettingsStore.getState().get("mediaPlayer");

        // Build descriptive filename with source metadata
        const meta = [source.resolution, source.quality, source.size].filter(Boolean).join(" ");
        const fileName = meta ? `${title} [${meta}]` : title;

        if (mediaPlayer === MediaPlayer.BROWSER) {
            usePreviewStore
                .getState()
                .openSinglePreview({ url: source.url, title: fileName, fileType: FileType.VIDEO });
        } else {
            openInPlayer({ url: source.url, fileName, player: mediaPlayer });
        }
    },

    play: async (request, addons) => {
        const { imdbId, type, title, tvParams } = request;

        // Filter and sort enabled addons
        const enabledAddons = addons.filter((a) => a.enabled).sort((a, b) => a.order - b.order);

        if (enabledAddons.length === 0) {
            toast.error("No addons enabled", {
                description: "Configure addons in settings to fetch sources",
            });
            return;
        }

        // Cancel previous request: dismiss old toast and increment request ID
        dismissToast();
        const currentRequestId = ++requestId;

        set({ activeRequest: request, selectedSource: null });
        toastId = toast.loading("Finding best source...", {
            description: title,
            position: TOAST_POSITION,
            cancel: { label: "Cancel", onClick: () => get().cancel() },
        });
        toastCreatedAt = Date.now();

        try {
            const sourcePromises = enabledAddons.map(async (addon) => {
                const queryKey = ["addon", addon.id, "sources", imdbId, type, tvParams] as const;

                const cached = queryClient.getQueryData<AddonSource[]>(queryKey);
                if (cached) return cached;

                try {
                    const client = new AddonClient({ url: addon.url });
                    const response = await client.fetchStreams(imdbId, type, tvParams);
                    const parsed = parseStreams(response.streams, addon.id, addon.name);
                    queryClient.setQueryData(queryKey, parsed);
                    return parsed;
                } catch {
                    return [] as AddonSource[];
                }
            });

            const results = await Promise.all(sourcePromises);

            // Ignore results if a newer request was started
            if (currentRequestId !== requestId) return;

            const allSources = results.flat();

            const streamingSettings = useSettingsStore.getState().get("streaming");
            const result = selectBestSource(allSources, streamingSettings);

            if (!result.hasMatches) {
                set({ activeRequest: null });
                toast.error("No sources found", {
                    id: toastId ?? undefined,
                    position: TOAST_POSITION,
                    description:
                        allSources.length > 0
                            ? "No sources match your quality preferences"
                            : "No sources available from enabled addons",
                });
                return;
            }

            const { playSource } = get();
            const source = result.source!;

            set({ activeRequest: null, selectedSource: source });

            showSourceToast({
                source,
                title,
                isCached: result.isCached,
                autoPlay: streamingSettings.autoPlay,
                allowUncached: streamingSettings.allowUncached,
                onPlay: () => playSource(source, title),
            });
        } catch (error) {
            // Only show error if this is still the current request
            if (currentRequestId === requestId) {
                toast.error("Failed to fetch sources", {
                    id: toastId ?? undefined,
                    position: TOAST_POSITION,
                    description: error instanceof Error ? error.message : "Unknown error",
                });
                set({ activeRequest: null });
            }
        }
    },

    cancel: () => {
        requestId++; // Increment to ignore pending request results
        set({ selectedSource: null, activeRequest: null });
        dismissToast();
    },
}));
