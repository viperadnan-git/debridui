"use client";

import { memo } from "react";
import { Info, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MediaPlayer } from "@/lib/types";

interface VideoCodecWarningProps {
    show: boolean;
    onClose: () => void;
    onSwitchPlayer: (player: MediaPlayer) => void;
}

export const VideoCodecWarning = memo(function VideoCodecWarning({
    show,
    onClose,
    onSwitchPlayer,
}: VideoCodecWarningProps) {
    if (!show) return null;

    return (
        <div className="absolute top-0 left-0 right-0 bg-yellow-500/90 text-black px-4 py-2 flex items-start gap-3 z-20">
            <Info className="h-5 w-5 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">This video format may have audio/codec issues in browser</p>
                <p className="text-xs mt-0.5">
                    Non-MP4 formats (MKV, AVI, etc.) may use codecs not supported in browsers. Switch to an external
                    player for best experience:
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                    <Button
                        size="sm"
                        variant="secondary"
                        className="text-xs"
                        onClick={() => onSwitchPlayer(MediaPlayer.VLC)}>
                        Use VLC
                    </Button>
                    <Button
                        size="sm"
                        variant="secondary"
                        className="text-xs"
                        onClick={() => onSwitchPlayer(MediaPlayer.MPV)}>
                        Use MPV
                    </Button>
                    <Button
                        size="sm"
                        variant="secondary"
                        className="text-xs"
                        onClick={() => onSwitchPlayer(MediaPlayer.IINA)}>
                        Use IINA
                    </Button>
                </div>
            </div>
            <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0 hover:bg-black/20" onClick={onClose}>
                <X className="h-4 w-4" />
            </Button>
        </div>
    );
});
