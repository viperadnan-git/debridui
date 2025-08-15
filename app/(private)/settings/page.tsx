"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useTheme } from "next-themes";
import { Monitor, Moon, Sun, Play } from "lucide-react";
import { useSettingsStore } from "@/lib/stores/settings";
import { MediaPlayer, mediaPlayers } from "@/lib/types";

export default function SettingsPage() {
    const { theme, setTheme } = useTheme();
    const { mediaPlayer, setMediaPlayer } = useSettingsStore();

    const themes = [
        { value: "light", label: "Light", icon: Sun },
        { value: "dark", label: "Dark", icon: Moon },
        { value: "system", label: "System", icon: Monitor },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Settings</h1>
                <p className="text-muted-foreground mt-2">
                    Manage your application preferences and settings.
                </p>
            </div>

            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Monitor className="h-5 w-5" />
                            Appearance
                        </CardTitle>
                        <CardDescription>
                            Customize the look and feel of your application.
                        </CardDescription>
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
                                                    <Icon className="h-4 w-4" />
                                                    {themeOption.label}
                                                </div>
                                            </SelectItem>
                                        );
                                    })}
                                </SelectContent>
                            </Select>
                            <p className="text-sm text-muted-foreground">
                                Choose how the application looks to you.
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Play className="h-5 w-5" />
                            Media Player
                        </CardTitle>
                        <CardDescription>
                            Choose your preferred media player for video playback.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="media-player">Default Player</Label>
                            <Select value={mediaPlayer} onValueChange={(value) => setMediaPlayer(value as MediaPlayer)}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Select media player" />
                                </SelectTrigger>
                                <SelectContent>
                                    {mediaPlayers.map((player) => (
                                        <SelectItem key={player.value} value={player.value}>
                                            {player.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-sm text-muted-foreground">
                                Videos will open in your selected player. External players require the application to be installed.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}