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
                description: "All platforms - Built-in browser preview with controls",
            },
            {
                value: MediaPlayer.VLC,
                label: "VLC",
                description: "All platforms - Cross-platform media player",
            },
            {
                value: MediaPlayer.KODI,
                label: "Kodi",
                description: "All platforms - Media center application",
            },
            {
                value: MediaPlayer.MPV,
                label: "MPV",
                description: "macOS, Windows, Linux - Lightweight media player",
            },
            {
                value: MediaPlayer.IINA,
                label: "IINA",
                description: "macOS - Powerful media player for macOS",
            },
            {
                value: MediaPlayer.INFUSE,
                label: "Infuse",
                description: "iOS, macOS - Premium video player for Apple devices",
            },
            {
                value: MediaPlayer.POTPLAYER,
                label: "PotPlayer",
                description: "Windows - Advanced media player for Windows",
            },
            {
                value: MediaPlayer.MX_PLAYER,
                label: "MX Player",
                description: "Android - Popular Android media player",
            },
            {
                value: MediaPlayer.MX_PLAYER_PRO,
                label: "MX Player Pro",
                description: "Android - Pro version of MX Player",
            },
        ],
    },
    downloadLinkMaxAge: {
        defaultValue: 900000, // 15 minutes in milliseconds
        presets: [
            { value: 300000, label: "5 minutes" },
            { value: 900000, label: "15 minutes" },
            { value: 3600000, label: "1 hour" },
            { value: 10800000, label: "3 hours" },
            { value: 21600000, label: "6 hours" },
            { value: 43200000, label: "12 hours" },
        ],
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
