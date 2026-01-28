"use client";

import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTheme } from "next-themes";
import { Monitor, Moon, Sun, Play, Trash2, Clock, Info, Settings } from "lucide-react";
import { useSettingsStore } from "@/lib/stores/settings";
import { MediaPlayer } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { del } from "idb-keyval";
import { queryClient } from "@/lib/query-client";
import { toast } from "sonner";
import { useAuthGuaranteed } from "@/components/auth/auth-provider";
import { formatDistanceToNow, format } from "date-fns";
import { PageHeader } from "@/components/page-header";
import { SectionDivider } from "@/components/section-divider";
import { detectPlatform, isSupportedPlayer, PLAYER_PLATFORM_SUPPORT } from "@/lib/utils/media-player";
import { getPlayerSetupInstruction } from "./player-setup-instructions";

// Build timestamp - injected at build time via next.config.ts, fallback to current time in dev
const BUILD_TIME = process.env.NEXT_PUBLIC_BUILD_TIME || new Date().toISOString();

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
    const [isClearing, setIsClearing] = useState(false);
    const platform = detectPlatform();
    const setupInstruction = getPlayerSetupInstruction(mediaPlayer, platform);
    const isPlayerSupported = isSupportedPlayer(mediaPlayer, platform);

    const handleClearCache = async (key?: string[]) => {
        setIsClearing(true);
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
        } finally {
            setIsClearing(false);
        }
    };

    const themes = [
        { value: "light", label: "Light", icon: Sun },
        { value: "dark", label: "Dark", icon: Moon },
        { value: "system", label: "System", icon: Monitor },
    ];

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
                                disabled={isClearing}
                                variant="outline">
                                Clear Links
                            </Button>
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-sm border border-destructive/30 bg-destructive/5 p-3">
                            <div>
                                <p className="text-sm">All Cached Data</p>
                                <p className="text-xs text-muted-foreground">Remove all cached data from browser</p>
                            </div>
                            <Button onClick={() => handleClearCache()} disabled={isClearing} variant="destructive">
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
