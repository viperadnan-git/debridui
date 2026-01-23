import { create } from "zustand";
import { persist } from "zustand/middleware";
import { type Addon } from "@/lib/addons/types";

export const DEFAULT_TORRENTIO_URL_PREFIX =
    "https://torrentio.strem.fun/providers=yts,eztv,rarbg,1337x,kickasstorrents,torrentgalaxy,magnetdl,horriblesubs,nyaasi,tokyotosho,anidex|qualityfilter=480p,other,scr,cam|limit=4";

interface AddonsStore {
    addons: Addon[];
    addAddon: (addon: Omit<Addon, "order">) => void;
    removeAddon: (id: string) => void;
    updateAddon: (id: string, updates: Partial<Omit<Addon, "id">>) => void;
    toggleAddon: (id: string) => void;
    reorderAddons: (addons: Addon[]) => void;
    getEnabledAddons: () => Addon[];
    hasAddons: () => boolean;
}

export const useAddonsStore = create<AddonsStore>()(
    persist(
        (set, get) => ({
            addons: [],

            addAddon: (addon) =>
                set((state) => {
                    // Check if addon with same URL already exists
                    const exists = state.addons.some((a) => a.url === addon.url);
                    if (exists) {
                        return state;
                    }

                    const maxOrder = Math.max(0, ...state.addons.map((a) => a.order));
                    const newAddon: Addon = {
                        ...addon,
                        order: maxOrder + 1,
                    };

                    return {
                        addons: [...state.addons, newAddon],
                    };
                }),

            removeAddon: (id) =>
                set((state) => ({
                    addons: state.addons.filter((a) => a.id !== id),
                })),

            updateAddon: (id, updates) =>
                set((state) => ({
                    addons: state.addons.map((a) => (a.id === id ? { ...a, ...updates } : a)),
                })),

            toggleAddon: (id) =>
                set((state) => ({
                    addons: state.addons.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a)),
                })),

            reorderAddons: (addons) =>
                set(() => ({
                    addons: addons.map((addon, index) => ({ ...addon, order: index })),
                })),

            getEnabledAddons: () => {
                return get()
                    .addons.filter((a) => a.enabled)
                    .sort((a, b) => a.order - b.order);
            },

            hasAddons: () => {
                return get().addons.length > 0;
            },
        }),
        {
            name: "debridui-addons",
        }
    )
);
