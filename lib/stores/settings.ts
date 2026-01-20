import { create } from "zustand";
import { persist } from "zustand/middleware";
import { MediaPlayer } from "../types";

type SettingValue = string | number | boolean | MediaPlayer;

type SettingPreset<T extends SettingValue> = {
    value: T;
    label: string;
    description?: string;
};

type SettingConfig<T extends SettingValue = SettingValue> = {
    defaultValue: T;
    presets?: SettingPreset<T>[];
};

type SettingsConfig = {
    smartOrder: SettingConfig<boolean>;
    hideTrash: SettingConfig<boolean>;
    mediaPlayer: SettingConfig<MediaPlayer>;
    downloadLinkMaxAge: SettingConfig<number>;
    torrentioUrlPrefix: SettingConfig<string>;
};

const settingsConfig: SettingsConfig = {
    smartOrder: {
        defaultValue: false,
    },
    hideTrash: {
        defaultValue: false,
    },
    mediaPlayer: {
        defaultValue: MediaPlayer.BROWSER,
        presets: [
            {
                value: MediaPlayer.BROWSER,
                label: "Browser Preview",
                description: "Built-in browser preview with controls",
            },
            { value: MediaPlayer.IINA, label: "IINA", description: "macOS media player" },
            { value: MediaPlayer.VLC, label: "VLC", description: "Cross-platform media player" },
            { value: MediaPlayer.MPV, label: "MPV", description: "Lightweight media player" },
            { value: MediaPlayer.POTPLAYER, label: "PotPlayer", description: "Windows media player" },
            { value: MediaPlayer.KODI, label: "Kodi", description: "Media center application" },
            { value: MediaPlayer.MX_PLAYER, label: "MX Player", description: "Android media player" },
            { value: MediaPlayer.MX_PLAYER_PRO, label: "MX Player Pro", description: "Android media player (Pro)" },
            { value: MediaPlayer.EMBED, label: "Embed Player", description: "Built-in web player" },
        ],
    },
    downloadLinkMaxAge: {
        defaultValue: 900000, // 15 minutes in milliseconds
        presets: [
            { value: 300000, label: "5 minutes", description: "Keep cached links for 5 minutes" },
            { value: 900000, label: "15 minutes", description: "Keep cached links for 15 minutes" },
            { value: 3600000, label: "1 hour", description: "Keep cached links for 1 hour" },
            { value: 10800000, label: "3 hours", description: "Keep cached links for 3 hours" },
            { value: 21600000, label: "6 hours", description: "Keep cached links for 6 hours" },
            { value: 43200000, label: "12 hours", description: "Keep cached links for 12 hours" },
        ],
    },
    torrentioUrlPrefix: {
        defaultValue:
            "https://torrentio.strem.fun/providers=yts,eztv,rarbg,1337x,kickasstorrents,torrentgalaxy,magnetdl,horriblesubs,nyaasi,tokyotosho,anidex|qualityfilter=480p,other,scr,cam|limit=4",
    },
};

type SettingsData = {
    [K in keyof SettingsConfig]: SettingsConfig[K]["defaultValue"];
};

interface SettingsStore {
    settings: SettingsData;
    get: <K extends keyof SettingsData>(key: K) => SettingsData[K];
    set: <K extends keyof SettingsData>(key: K, value: SettingsData[K]) => void;
    setMultiple: (updates: Partial<SettingsData>) => void;
    reset: () => void;
    resetKey: <K extends keyof SettingsData>(key: K) => void;
    getPresets: <K extends keyof SettingsConfig>(key: K) => SettingsConfig[K]["presets"];
    getConfig: () => SettingsConfig;
}

const getDefaultSettings = (): SettingsData => {
    return {
        smartOrder: settingsConfig.smartOrder.defaultValue,
        hideTrash: settingsConfig.hideTrash.defaultValue,
        mediaPlayer: settingsConfig.mediaPlayer.defaultValue,
        downloadLinkMaxAge: settingsConfig.downloadLinkMaxAge.defaultValue,
        torrentioUrlPrefix: settingsConfig.torrentioUrlPrefix.defaultValue,
    };
};

export const useSettingsStore = create<SettingsStore>()(
    persist(
        (set, get) => ({
            settings: getDefaultSettings(),

            get: (key) => get().settings[key],

            set: (key, value) =>
                set((state) => ({
                    settings: {
                        ...state.settings,
                        [key]: value,
                    },
                })),

            setMultiple: (updates) =>
                set((state) => ({
                    settings: {
                        ...state.settings,
                        ...updates,
                    },
                })),

            reset: () =>
                set({
                    settings: getDefaultSettings(),
                }),

            resetKey: (key) =>
                set((state) => ({
                    settings: {
                        ...state.settings,
                        [key]: settingsConfig[key].defaultValue,
                    },
                })),

            getPresets: (key) => settingsConfig[key].presets,

            getConfig: () => settingsConfig,
        }),
        {
            name: "debridui-settings",
            partialize: (state) => ({ settings: state.settings }),
        }
    )
);
