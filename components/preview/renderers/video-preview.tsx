"use client";

import { useState } from "react";
import { DebridFileNode, MediaPlayer } from "@/lib/types";
import { AlertCircle, Info, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSettingsStore } from "@/lib/stores/settings";

interface VideoPreviewProps {
    file: DebridFileNode;
    downloadUrl: string;
    onLoad?: () => void;
    onError?: (error: Error) => void;
}

export function VideoPreview({ file, downloadUrl, onLoad, onError }: VideoPreviewProps) {
    const [error, setError] = useState(false);
    const [showCodecWarning, setShowCodecWarning] = useState(true);
    const { set } = useSettingsStore();

    // Check if file is not MP4 (may have codec issues in browser)
    const isNonMP4Video = !file.name.toLowerCase().endsWith(".mp4");

    const handleLoad = () => {
        onLoad?.();
    };

    const handleError = () => {
        setError(true);
        onError?.(new Error("Failed to load video"));
    };

    const switchToPlayer = (player: MediaPlayer) => {
        set("mediaPlayer", player);
        setShowCodecWarning(false);
        // Reload the page to apply the new setting
        window.location.reload();
    };

    return (
        <div className="relative w-full h-full flex flex-col bg-black">
            {/* Codec Warning Banner for Non-MP4 Videos */}
            {isNonMP4Video && showCodecWarning && (
                <div className="bg-yellow-500/90 text-black px-4 py-2 flex items-start gap-3 z-20">
                    <Info className="h-5 w-5 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">This video format may have audio/codec issues in browser</p>
                        <p className="text-xs mt-0.5">
                            Non-MP4 formats (MKV, AVI, etc.) may use codecs not supported in browsers. Switch to an
                            external player for best experience:
                        </p>
                        <div className="flex flex-wrap gap-2 mt-2">
                            <Button
                                size="sm"
                                variant="secondary"
                                className="h-7 text-xs"
                                onClick={() => switchToPlayer(MediaPlayer.VLC)}>
                                Use VLC
                            </Button>
                            <Button
                                size="sm"
                                variant="secondary"
                                className="h-7 text-xs"
                                onClick={() => switchToPlayer(MediaPlayer.MPV)}>
                                Use MPV
                            </Button>
                            <Button
                                size="sm"
                                variant="secondary"
                                className="h-7 text-xs"
                                onClick={() => switchToPlayer(MediaPlayer.IINA)}>
                                Use IINA
                            </Button>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 shrink-0 hover:bg-black/20"
                        onClick={() => setShowCodecWarning(false)}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            )}

            {error ? (
                <div className="flex-1 flex flex-col items-center justify-center text-white">
                    <AlertCircle className="h-12 w-12 mb-2" />
                    <p className="text-sm">Failed to load video</p>
                    <p className="text-xs text-white/70 mt-1">{file.name}</p>
                </div>
            ) : (
                <div className="flex-1 flex items-center justify-center">
                    <video
                        src={downloadUrl}
                        controls
                        autoPlay
                        className="max-w-full max-h-full"
                        onLoadedData={handleLoad}
                        onError={handleError}
                    />
                </div>
            )}
        </div>
    );
}
