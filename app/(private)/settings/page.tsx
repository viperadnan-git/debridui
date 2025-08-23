"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTheme } from "next-themes";
import { Monitor, Moon, Sun, Play, Trash2 } from "lucide-react";
import { useSettingsStore } from "@/lib/stores/settings";
import { MediaPlayer } from "@/lib/types";
import { MEDIA_PLAYER_LABELS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { del } from "idb-keyval";
import { queryClient } from "@/lib/query-client";
import { toast } from "sonner";
import { useShallow } from "zustand/react/shallow";
import { useAuthContext } from "@/lib/contexts/auth";

export default function SettingsPage() {
    const { theme, setTheme } = useTheme();
    const { currentUser } = useAuthContext();
    const { mediaPlayer, setMediaPlayer } = useSettingsStore(
        useShallow((state) => ({
            mediaPlayer: state.mediaPlayer,
            setMediaPlayer: state.setMediaPlayer,
        }))
    );
    const [isClearing, setIsClearing] = useState(false);

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
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Settings</h1>
                <p className="text-muted-foreground mt-2">Manage your application preferences and settings.</p>
            </div>

            <div className="flex flex-col gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Monitor className="h-5 w-5" />
                            Appearance
                        </CardTitle>
                        <CardDescription>Customize the look and feel of your application.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="theme">Theme</Label>
                            <Select value={theme} onValueChange={setTheme}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Select theme" />
                                </SelectTrigger>
                                <SelectContent>
                                    {themes.map((themeOption) => {
                                        const Icon = themeOption.icon;
                                        return (
                                            <SelectItem key={themeOption.value} value={themeOption.value}>
                                                <div className="flex items-center gap-2">
                                                    <Icon className="size-4" />
                                                    {themeOption.label}
                                                </div>
                                            </SelectItem>
                                        );
                                    })}
                                </SelectContent>
                            </Select>
                            <p className="text-sm text-muted-foreground">Choose how the application looks to you.</p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Play className="h-5 w-5" />
                            Media Player
                        </CardTitle>
                        <CardDescription>Choose your preferred media player for video playback.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="media-player">Default Player</Label>
                            <Select value={mediaPlayer} onValueChange={(value) => setMediaPlayer(value as MediaPlayer)}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Select media player" />
                                </SelectTrigger>
                                <SelectContent>
                                    {MEDIA_PLAYER_LABELS.map((player) => (
                                        <SelectItem key={player.value} value={player.value}>
                                            {player.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-sm text-muted-foreground">
                                Videos will open in your selected player. External players require the application to be
                                installed.
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Trash2 className="h-5 w-5" />
                            Cache Management
                        </CardTitle>
                        <CardDescription>Manage application cache and stored data.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-4">
                                <Button
                                    onClick={() => handleClearCache([currentUser.id, "getDownloadLink"])}
                                    disabled={isClearing}
                                    variant="destructive">
                                    Clear Download Links Cache
                                </Button>
                                <p className="text-sm text-muted-foreground">
                                    Remove all cached download links from browser.
                                </p>
                            </div>
                            <div className="flex flex-wrap items-center gap-4">
                                <Button onClick={() => handleClearCache()} disabled={isClearing} variant="destructive">
                                    Clear All Cache
                                </Button>
                                <p className="text-sm text-muted-foreground">Remove all cached data from browser.</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
