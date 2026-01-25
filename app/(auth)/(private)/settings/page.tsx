"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTheme } from "next-themes";
import { Monitor, Moon, Sun, Play, Trash2, Clock, Settings as SettingsIcon, Info } from "lucide-react";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { detectPlatform } from "@/lib/utils/media-player";
import { getPlayerSetupInstruction } from "./player-setup-instructions";

// Build timestamp - injected at build time via next.config.ts, fallback to current time in dev
const BUILD_TIME = process.env.NEXT_PUBLIC_BUILD_TIME || new Date().toISOString();

export default function SettingsPage() {
    const { theme, setTheme } = useTheme();
    const { currentUser } = useAuthGuaranteed();
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
        <div className="mx-auto w-full max-w-5xl space-y-8 pb-16">
            <PageHeader icon={SettingsIcon} title="Settings" description="Manage your application preferences" />

            {/* Settings Grid */}
            <div className="grid gap-6 md:grid-cols-2">
                {/* Appearance */}
                <Card className="md:col-span-2 lg:col-span-1">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10">
                                <Monitor className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <CardTitle>Appearance</CardTitle>
                                <CardDescription>Customize how the app looks</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-3">
                            <Label htmlFor="theme" className="text-sm font-medium">
                                Theme
                            </Label>
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
                                                    <Icon className="h-4 w-4" />
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
                    </CardContent>
                </Card>

                {/* Media Player */}
                <Card className="md:col-span-2 lg:col-span-1">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10">
                                <Play className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <CardTitle>Media Player</CardTitle>
                                <CardDescription>Default video player</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-3">
                            <Label htmlFor="media-player" className="text-sm font-medium">
                                Default Player
                            </Label>
                            <Select
                                value={mediaPlayer}
                                onValueChange={(value) => set("mediaPlayer", value as MediaPlayer)}>
                                <SelectTrigger id="media-player" className="w-full">
                                    <SelectValue placeholder="Select media player">
                                        {mediaPlayerPresets.find((p) => p.value === mediaPlayer)?.label}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    {mediaPlayerPresets.map((preset) => (
                                        <SelectItem key={preset.value} value={preset.value}>
                                            <div className="flex flex-col gap-0.5">
                                                <span className="font-medium">{preset.label}</span>
                                                <span className="text-xs text-muted-foreground">
                                                    {preset.description}
                                                </span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                                External players require the application to be installed
                            </p>
                        </div>
                        {setupInstruction && (
                            <Alert>
                                <Info className="h-4 w-4" />
                                <AlertDescription>{setupInstruction}</AlertDescription>
                            </Alert>
                        )}
                    </CardContent>
                </Card>

                {/* Download Link Cache */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10">
                                <Clock className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <CardTitle>Download Link Cache</CardTitle>
                                <CardDescription>Control how long links are cached in memory</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-3">
                            <Label htmlFor="download-link-max-age" className="text-sm font-medium">
                                Cache Duration
                            </Label>
                            <Select
                                value={String(downloadLinkMaxAge)}
                                onValueChange={(value) => set("downloadLinkMaxAge", Number(value))}>
                                <SelectTrigger id="download-link-max-age" className="w-full max-w-xs">
                                    <SelectValue placeholder="Select duration" />
                                </SelectTrigger>
                                <SelectContent>
                                    {downloadLinkMaxAgePresets.map((preset) => (
                                        <SelectItem
                                            key={preset.value}
                                            value={String(preset.value)}
                                            title={preset.description}>
                                            {preset.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                                Links will be kept in memory for this duration before being garbage collected
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Cache Management */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-destructive/10">
                                <Trash2 className="h-5 w-5 text-destructive" />
                            </div>
                            <div>
                                <CardTitle>Cache Management</CardTitle>
                                <CardDescription>Clear cached data to free up space</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex flex-col gap-3 rounded-lg border p-4">
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <p className="font-medium">Download Links Cache</p>
                                        <p className="text-sm text-muted-foreground">
                                            Remove all cached download links
                                        </p>
                                    </div>
                                    <Button
                                        onClick={() => handleClearCache([currentUser.id, "getDownloadLink"])}
                                        disabled={isClearing}
                                        variant="destructive"
                                        size="sm"
                                        className="w-full sm:w-auto">
                                        Clear Links
                                    </Button>
                                </div>
                            </div>
                            <div className="flex flex-col gap-3 rounded-lg border border-destructive/50 bg-destructive/5 p-4">
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <p className="font-medium">All Cached Data</p>
                                        <p className="text-sm text-muted-foreground">
                                            Remove all cached data from browser
                                        </p>
                                    </div>
                                    <Button
                                        onClick={() => handleClearCache()}
                                        disabled={isClearing}
                                        variant="destructive"
                                        size="sm"
                                        className="w-full sm:w-auto">
                                        Clear All
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* About */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10">
                                <Info className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <CardTitle>About</CardTitle>
                                <CardDescription>Application information</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3 rounded-lg border p-4">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <p className="text-sm font-medium">Last Updated</p>
                                    <p className="text-sm text-muted-foreground">
                                        <Clock className="mr-1.5 inline-block h-3.5 w-3.5" />
                                        {buildTimeFormatted} ({buildTimeRelative})
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
