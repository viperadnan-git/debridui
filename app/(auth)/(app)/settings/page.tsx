"use client";

import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { useTheme } from "next-themes";
import { Monitor, Moon, Sun, Play, Trash2, Clock, Info, Settings, Zap, Sliders } from "lucide-react";
import {
    useSettingsStore,
    type StreamingSettings,
    type StreamingResolution,
    type QualityProfileId,
    type QualityRange,
    QUALITY_PROFILES,
} from "@/lib/stores/settings";
import { RESOLUTIONS, SOURCE_QUALITIES } from "@/lib/addons/parser";
import { Resolution, SourceQuality } from "@/lib/addons/types";
import { MediaPlayer } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { del } from "idb-keyval";
import { queryClient } from "@/lib/query-client";
import { toast } from "sonner";
import { useAuthGuaranteed } from "@/components/auth/auth-provider";
import { formatDistanceToNow, format } from "date-fns";
import { PageHeader } from "@/components/page-header";
import { SectionDivider } from "@/components/section-divider";
import { detectPlatform, isSupportedPlayer, PLAYER_PLATFORM_SUPPORT } from "@/lib/utils/media-player";
import { getPlayerSetupInstruction } from "./player-setup-instructions";
import { cn } from "@/lib/utils";

// Build timestamp - injected at build time via next.config.ts, fallback to current time in dev
const BUILD_TIME = process.env.NEXT_PUBLIC_BUILD_TIME || new Date().toISOString();

const RESOLUTION_OPTIONS: { value: StreamingResolution; label: string }[] = [
    { value: "any", label: "Any" },
    ...RESOLUTIONS.map((r) => ({ value: r, label: r === Resolution.UHD_4K ? "4K" : r })).reverse(),
];

const SOURCE_QUALITY_OPTIONS: { value: SourceQuality | "any"; label: string }[] = [
    { value: "any", label: "Any" },
    ...SOURCE_QUALITIES.map((q) => ({ value: q, label: q })),
];

export default function SettingsPage() {
    const { theme, setTheme } = useTheme();
    const { currentAccount } = useAuthGuaranteed();
    const buildDate = new Date(BUILD_TIME);
    const buildTimeFormatted = format(buildDate, "PPpp");
    const buildTimeRelative = formatDistanceToNow(buildDate, { addSuffix: true });
    const { get, set, getPresets } = useSettingsStore();
    const mediaPlayer = get("mediaPlayer");
    const mediaPlayerPresets = getPresets("mediaPlayer") || [];
    const downloadLinkMaxAge = get("downloadLinkMaxAge");
    const downloadLinkMaxAgePresets = getPresets("downloadLinkMaxAge") || [];
    const streaming = get("streaming");

    const updateStreaming = (updates: Partial<StreamingSettings>) => {
        set("streaming", { ...streaming, ...updates });
    };

    const updateCustomRange = (updates: Partial<QualityRange>) => {
        updateStreaming({
            customRange: { ...streaming.customRange, ...updates },
        });
    };

    const selectProfile = (profileId: QualityProfileId) => {
        if (profileId === "custom" && streaming.profileId !== "custom") {
            // Copy current profile's range to custom when switching to custom
            const currentProfile = QUALITY_PROFILES.find((p) => p.id === streaming.profileId);
            if (currentProfile) {
                updateStreaming({ profileId, customRange: { ...currentProfile.range } });
                return;
            }
        }
        updateStreaming({ profileId });
    };

    const platform = detectPlatform();
    const setupInstruction = getPlayerSetupInstruction(mediaPlayer, platform);
    const isPlayerSupported = isSupportedPlayer(mediaPlayer, platform);

    const handleClearCache = async (key?: string[]) => {
        const toastId = toast.loading("Clearing cache...");
        try {
            if (key) {
                queryClient.removeQueries({ queryKey: key });
            } else {
                await del("DEBRIDUI_CACHE");
                queryClient.clear();
            }
            toast.success("Cache cleared successfully", { id: toastId });
        } catch (error) {
            toast.error("Failed to clear cache", { id: toastId });
            console.error("Error clearing cache:", error);
        }
    };

    const themes = [
        { value: "light", label: "Light", icon: Sun },
        { value: "dark", label: "Dark", icon: Moon },
        { value: "system", label: "System", icon: Monitor },
    ];

    const isCustom = streaming.profileId === "custom";

    return (
        <div className="mx-auto w-full max-w-4xl space-y-8 pb-16">
            <PageHeader icon={Settings} title="Settings" description="Manage your application preferences" />

            {/* Appearance Section */}
            <section className="space-y-4">
                <SectionDivider label="Appearance" />

                <div className="grid gap-6 md:grid-cols-2">
                    {/* Theme */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <Monitor className="size-4 text-muted-foreground" />
                            <Label htmlFor="theme" className="text-sm">
                                Theme
                            </Label>
                        </div>
                        <Select value={theme} onValueChange={setTheme}>
                            <SelectTrigger id="theme" className="w-full">
                                <SelectValue placeholder="Select theme" />
                            </SelectTrigger>
                            <SelectContent>
                                {themes.map((themeOption) => {
                                    const Icon = themeOption.icon;
                                    return (
                                        <SelectItem key={themeOption.value} value={themeOption.value}>
                                            <div className="flex items-center gap-2">
                                                <Icon className="size-3.5" />
                                                <span>{themeOption.label}</span>
                                            </div>
                                        </SelectItem>
                                    );
                                })}
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                            Select your preferred color scheme for the interface
                        </p>
                    </div>

                    {/* Media Player */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <Play className="size-4 text-muted-foreground" />
                            <Label htmlFor="media-player" className="text-sm">
                                Default Player
                            </Label>
                        </div>
                        <Select value={mediaPlayer} onValueChange={(value) => set("mediaPlayer", value as MediaPlayer)}>
                            <SelectTrigger id="media-player" className="w-full">
                                <SelectValue placeholder="Select media player">
                                    {mediaPlayerPresets.find((p) => p.value === mediaPlayer)?.label}
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                {mediaPlayerPresets.map((preset) => (
                                    <SelectItem key={preset.value} value={preset.value}>
                                        <div className="flex flex-col gap-0.5">
                                            <span>{preset.label}</span>
                                            <span className="text-xs text-muted-foreground">{preset.description}</span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                            External players require the application to be installed
                        </p>
                    </div>
                </div>

                {!isPlayerSupported && (
                    <div className="flex items-start gap-3 rounded-sm border border-yellow-500/50 bg-yellow-500/10 p-3 text-xs text-yellow-600 dark:text-yellow-500">
                        <Info className="size-3.5 shrink-0 mt-0.5" />
                        <p>
                            {mediaPlayer} is not officially supported on {platform}. Supported platforms:{" "}
                            {PLAYER_PLATFORM_SUPPORT[mediaPlayer].join(", ")}
                        </p>
                    </div>
                )}

                {setupInstruction && (
                    <div className="flex items-start gap-3 rounded-sm border border-border/50 p-3 text-xs text-muted-foreground">
                        <Info className="size-3.5 shrink-0 mt-0.5" />
                        <p>{setupInstruction}</p>
                    </div>
                )}
            </section>

            {/* Streaming Section */}
            <section className="space-y-4">
                <SectionDivider label="Streaming" />

                {/* Quality Profile */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <Sliders className="size-4 text-muted-foreground" />
                        <Label className="text-sm">Quality Profile</Label>
                    </div>

                    {/* Profile Chips */}
                    <div className="flex flex-wrap gap-2">
                        {QUALITY_PROFILES.map((profile) => (
                            <button
                                key={profile.id}
                                onClick={() => selectProfile(profile.id)}
                                className={cn(
                                    "group relative px-3 py-1.5 text-sm rounded-sm border transition-all duration-300",
                                    streaming.profileId === profile.id
                                        ? "border-primary bg-primary/5 text-foreground"
                                        : "border-border/50 text-muted-foreground hover:border-border hover:text-foreground"
                                )}>
                                <span className="font-medium">{profile.name}</span>
                                <span className="ml-1.5 text-xs opacity-60">{profile.description}</span>
                            </button>
                        ))}
                        <button
                            onClick={() => selectProfile("custom")}
                            className={cn(
                                "group relative px-3 py-1.5 text-sm rounded-sm border transition-all duration-300",
                                isCustom
                                    ? "border-primary bg-primary/5 text-foreground"
                                    : "border-border/50 text-muted-foreground hover:border-border hover:text-foreground"
                            )}>
                            <span className="font-medium">Custom</span>
                        </button>
                    </div>

                    {/* Custom Range Panel */}
                    <Collapsible open={isCustom}>
                        <CollapsibleContent>
                            <div className="mt-3 p-4 rounded-sm border border-border/50 bg-muted/10 space-y-5">
                                {/* Resolution Range */}
                                <div className="space-y-3">
                                    <span className="text-xs tracking-widest uppercase text-muted-foreground">
                                        Resolution
                                    </span>
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <div className="space-y-1.5">
                                            <span className="text-xs text-muted-foreground">Minimum</span>
                                            <Select
                                                value={streaming.customRange.minResolution}
                                                onValueChange={(v) =>
                                                    updateCustomRange({ minResolution: v as StreamingResolution })
                                                }>
                                                <SelectTrigger className="w-full">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {RESOLUTION_OPTIONS.map((opt) => (
                                                        <SelectItem key={opt.value} value={opt.value}>
                                                            {opt.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <span className="text-xs text-muted-foreground">Maximum</span>
                                            <Select
                                                value={streaming.customRange.maxResolution}
                                                onValueChange={(v) =>
                                                    updateCustomRange({ maxResolution: v as StreamingResolution })
                                                }>
                                                <SelectTrigger className="w-full">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {RESOLUTION_OPTIONS.map((opt) => (
                                                        <SelectItem key={opt.value} value={opt.value}>
                                                            {opt.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>

                                {/* Source Quality Range */}
                                <div className="space-y-3">
                                    <span className="text-xs tracking-widest uppercase text-muted-foreground">
                                        Source Quality
                                    </span>
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <div className="space-y-1.5">
                                            <span className="text-xs text-muted-foreground">Minimum</span>
                                            <Select
                                                value={streaming.customRange.minSourceQuality}
                                                onValueChange={(v) =>
                                                    updateCustomRange({
                                                        minSourceQuality: v as SourceQuality | "any",
                                                    })
                                                }>
                                                <SelectTrigger className="w-full">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {SOURCE_QUALITY_OPTIONS.map((opt) => (
                                                        <SelectItem key={opt.value} value={opt.value}>
                                                            {opt.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <span className="text-xs text-muted-foreground">Maximum</span>
                                            <Select
                                                value={streaming.customRange.maxSourceQuality}
                                                onValueChange={(v) =>
                                                    updateCustomRange({
                                                        maxSourceQuality: v as SourceQuality | "any",
                                                    })
                                                }>
                                                <SelectTrigger className="w-full">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {SOURCE_QUALITY_OPTIONS.map((opt) => (
                                                        <SelectItem key={opt.value} value={opt.value}>
                                                            {opt.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>

                                <p className="text-xs text-muted-foreground">
                                    Sources outside these ranges will be filtered out during auto-selection.
                                </p>
                            </div>
                        </CollapsibleContent>
                    </Collapsible>
                </div>

                {/* Toggle Settings */}
                <div className="space-y-4 pt-2">
                    <div className="flex items-center justify-between gap-3 rounded-sm border border-border/50 p-3">
                        <div className="space-y-0.5 min-w-0">
                            <div className="flex items-center gap-2">
                                <Zap className="size-4 text-muted-foreground shrink-0" />
                                <Label htmlFor="allow-uncached" className="text-sm">
                                    Allow Uncached Sources
                                </Label>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Automatically play uncached sources without confirmation
                            </p>
                        </div>
                        <Switch
                            id="allow-uncached"
                            className="shrink-0"
                            checked={streaming.allowUncached}
                            onCheckedChange={(checked) => updateStreaming({ allowUncached: checked })}
                        />
                    </div>

                    <div className="flex items-center justify-between gap-3 rounded-sm border border-border/50 p-3">
                        <div className="space-y-0.5 min-w-0">
                            <div className="flex items-center gap-2">
                                <Play className="size-4 text-muted-foreground shrink-0" />
                                <Label htmlFor="auto-play" className="text-sm">
                                    Auto-play
                                </Label>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Automatically start playback when a cached source is found
                            </p>
                        </div>
                        <Switch
                            id="auto-play"
                            className="shrink-0"
                            checked={streaming.autoPlay}
                            onCheckedChange={(checked) => updateStreaming({ autoPlay: checked })}
                        />
                    </div>
                </div>
            </section>

            {/* Cache Section */}
            <section className="space-y-4">
                <SectionDivider label="Cache" />

                {/* Download Link Cache Duration */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <Clock className="size-4 text-muted-foreground" />
                        <Label htmlFor="download-link-max-age" className="text-sm">
                            Cache Duration
                        </Label>
                    </div>
                    <Select
                        value={String(downloadLinkMaxAge)}
                        onValueChange={(value) => set("downloadLinkMaxAge", Number(value))}>
                        <SelectTrigger id="download-link-max-age" className="w-full max-w-xs">
                            <SelectValue placeholder="Select duration" />
                        </SelectTrigger>
                        <SelectContent>
                            {downloadLinkMaxAgePresets.map((preset) => (
                                <SelectItem key={preset.value} value={String(preset.value)} title={preset.description}>
                                    {preset.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                        Links will be kept in memory for this duration before being garbage collected
                    </p>
                </div>

                {/* Cache Management */}
                <div className="space-y-3 pt-2">
                    <div className="flex items-center gap-2">
                        <Trash2 className="size-4 text-muted-foreground" />
                        <span className="text-sm">Clear Cache</span>
                    </div>

                    <div className="space-y-2">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-sm border border-border/50 p-3">
                            <div>
                                <p className="text-sm">Download Links Cache</p>
                                <p className="text-xs text-muted-foreground">Remove all cached download links</p>
                            </div>
                            <Button
                                onClick={() => handleClearCache([currentAccount.id, "getDownloadLink"])}
                                variant="outline">
                                Clear Links
                            </Button>
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-sm border border-destructive/30 bg-destructive/5 p-3">
                            <div>
                                <p className="text-sm">All Cached Data</p>
                                <p className="text-xs text-muted-foreground">Remove all cached data from browser</p>
                            </div>
                            <Button onClick={() => handleClearCache()} variant="destructive">
                                Clear All
                            </Button>
                        </div>
                    </div>
                </div>
            </section>

            {/* About Section */}
            <section className="space-y-4">
                <SectionDivider label="About" />

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="size-3.5" />
                    <span>Last updated {buildTimeRelative}</span>
                    <span className="text-border">·</span>
                    <span className="text-xs">{buildTimeFormatted}</span>
                </div>
            </section>
        </div>
    );
}
