import type { z } from "zod";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Resolution, SourceQuality } from "../addons/types";
import {
    type DeepPartial,
    pickValid,
    type qualityRangeSchema,
    settingsSchema,
    type streamingSettingsSchema,
} from "../schemas";
import { MediaPlayer } from "../types";

export type QualityRange = z.infer<typeof qualityRangeSchema>;
export type StreamingResolution = QualityRange["minResolution"];
export type StreamingSettings = z.infer<typeof streamingSettingsSchema>;
export type QualityProfileId = StreamingSettings["profileId"];

export interface QualityProfile {
    id: QualityProfileId;
    name: string;
    description: string;
    range: QualityRange;
}

export const QUALITY_PROFILES: QualityProfile[] = [
    {
        id: "max-quality",
        name: "Maximum",
        description: "No limits",
        range: {
            minResolution: "any",
            maxResolution: "any",
            minSourceQuality: "any",
            maxSourceQuality: "any",
        },
    },
    {
        id: "high-quality",
        name: "High",
        description: "4K BluRay, skip REMUX",
        range: {
            minResolution: Resolution.FHD_1080P,
            maxResolution: "any",
            minSourceQuality: SourceQuality.WEBRIP,
            maxSourceQuality: SourceQuality.BLURAY,
        },
    },
    {
        id: "balanced",
        name: "Balanced",
        description: "Up to 1080p WEB-DL",
        range: {
            minResolution: Resolution.SD_480P,
            maxResolution: Resolution.FHD_1080P,
            minSourceQuality: SourceQuality.HDRIP,
            maxSourceQuality: SourceQuality.WEB_DL,
        },
    },
    {
        id: "data-saver",
        name: "Data Saver",
        description: "Up to 720p WEB-DL",
        range: {
            minResolution: Resolution.SD_480P,
            maxResolution: Resolution.HD_720P,
            minSourceQuality: SourceQuality.HDRIP,
            maxSourceQuality: SourceQuality.WEB_DL,
        },
    },
    {
        id: "low-bandwidth",
        name: "Low Bandwidth",
        description: "Up to 720p, any source",
        range: {
            minResolution: "any",
            maxResolution: Resolution.HD_720P,
            minSourceQuality: "any",
            maxSourceQuality: SourceQuality.WEB_DL,
        },
    },
];

export function getActiveRange(settings: StreamingSettings): QualityRange {
    if (settings.profileId === "custom") {
        return settings.customRange;
    }
    const profile = QUALITY_PROFILES.find((p) => p.id === settings.profileId);
    return profile?.range ?? QUALITY_PROFILES[2].range; // fallback to balanced
}

type SettingPreset<T> = {
    value: T;
    label: string;
    description?: string;
};

type SettingConfig<T> = {
    defaultValue: T;
    presets?: SettingPreset<T>[];
};

export type SettingsData = z.infer<typeof settingsSchema>;

type SettingsConfig = { [K in keyof SettingsData]: SettingConfig<SettingsData[K]> };

const settingsConfig: SettingsConfig = {
    smartOrder: {
        defaultValue: false,
    },
    hideTrash: {
        defaultValue: false,
    },
    quickPlay: {
        defaultValue: true,
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
    streaming: {
        defaultValue: {
            profileId: "high-quality",
            customRange: {
                minResolution: Resolution.FHD_1080P,
                maxResolution: "any",
                minSourceQuality: SourceQuality.WEBRIP,
                maxSourceQuality: SourceQuality.BLURAY,
            },
            allowUncached: false,
            autoPlay: true,
        },
    },
    tmdbApiKey: {
        defaultValue: "",
    },
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
        quickPlay: settingsConfig.quickPlay.defaultValue,
        mediaPlayer: settingsConfig.mediaPlayer.defaultValue,
        downloadLinkMaxAge: settingsConfig.downloadLinkMaxAge.defaultValue,
        streaming: settingsConfig.streaming.defaultValue,
        tmdbApiKey: settingsConfig.tmdbApiKey.defaultValue,
    };
};

const deepMerge = <T extends Record<string, unknown>>(target: T, source: DeepPartial<T>): T => {
    const result = { ...target };
    for (const key of Object.keys(source) as (keyof T)[]) {
        const targetVal = target[key];
        const sourceVal = source[key];
        result[key] = (
            targetVal && typeof targetVal === "object" && !Array.isArray(targetVal)
                ? deepMerge(targetVal as Record<string, unknown>, sourceVal as DeepPartial<Record<string, unknown>>)
                : sourceVal
        ) as T[keyof T];
    }
    return result;
};

export function normalizeSettings(input: unknown, base: SettingsData = getDefaultSettings()): SettingsData {
    return deepMerge(base, pickValid(settingsSchema, input));
}

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
            merge: (persisted, current) => ({
                ...current,
                settings: normalizeSettings((persisted as { settings?: unknown })?.settings),
            }),
        }
    )
);
