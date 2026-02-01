import { create } from "zustand";
import { type AddonSource } from "@/lib/addons/types";
import { AddonClient } from "@/lib/addons/client";
import { parseStreams } from "@/lib/addons/parser";
import { selectBestSource } from "@/lib/streaming/source-selector";
import { queryClient } from "@/lib/query-client";
import { toast } from "sonner";
import { FileType, MediaPlayer } from "@/lib/types";
import { openInPlayer } from "@/lib/utils/media-player";
import { useSettingsStore } from "./settings";
import { usePreviewStore } from "./preview";

import { type TvSearchParams } from "@/lib/addons/types";

export interface StreamingRequest {
    imdbId: string;
    type: "movie" | "show";
    title: string;
    tvParams?: TvSearchParams;
}

interface StreamingState {
    activeRequest: StreamingRequest | null;
    selectedSource: AddonSource | null;

    play: (request: StreamingRequest, addons: { id: string; url: string; name: string }[]) => Promise<void>;
    playSource: (source: AddonSource, title: string) => void;
    dismiss: () => void;
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

        if (addons.length === 0) {
            toast.error("No addons enabled", {
                description: "Configure addons in settings to fetch sources",
            });
            return;
        }

        // Cancel previous request: dismiss old toast and increment request ID
        dismissToast();
        const currentRequestId = ++requestId;

        set({ activeRequest: request, selectedSource: null });
        toastId = toast.loading("Finding best source...", { description: title, position: TOAST_POSITION });
        toastCreatedAt = Date.now();

        try {
            const sourcePromises = addons.map(async (addon) => {
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

            set({ activeRequest: null });

            if (result.isCached && result.source) {
                if (streamingSettings.autoPlay) {
                    dismissToast();
                    playSource(result.source, title);
                } else {
                    set({ selectedSource: result.source });
                    toast.success(title, {
                        id: toastId ?? undefined,
                        position: TOAST_POSITION,
                        description:
                            `${result.source.resolution || ""} ${result.source.quality || ""} · ${result.source.size || ""} · Cached`.trim(),
                        action: {
                            label: "Play",
                            onClick: () => playSource(result.source!, title),
                        },
                        duration: Infinity,
                    });
                }
            } else if (result.source) {
                if (streamingSettings.allowUncached) {
                    if (streamingSettings.autoPlay) {
                        dismissToast();
                        playSource(result.source, title);
                    } else {
                        set({ selectedSource: result.source });
                        toast.success(title, {
                            id: toastId ?? undefined,
                            position: TOAST_POSITION,
                            description:
                                `${result.source.resolution || ""} ${result.source.quality || ""} · ${result.source.size || ""} · Not cached`.trim(),
                            action: {
                                label: "Play",
                                onClick: () => playSource(result.source!, title),
                            },
                            duration: Infinity,
                        });
                    }
                } else {
                    set({ selectedSource: result.source });
                    toast.warning(title, {
                        id: toastId ?? undefined,
                        position: TOAST_POSITION,
                        description:
                            `${result.source.resolution || ""} ${result.source.quality || ""} · ${result.source.size || ""} · Uncached`.trim(),
                        action: {
                            label: "Play Anyway",
                            onClick: () => playSource(result.source!, title),
                        },
                        duration: Infinity,
                    });
                }
            }
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

    dismiss: () => {
        set({ selectedSource: null, activeRequest: null });
        dismissToast();
    },
}));
