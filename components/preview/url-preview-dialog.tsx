"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, AlertCircle, Loader2 } from "lucide-react";
import { MediaPlayer } from "@/lib/types";
import { useSettingsStore } from "@/lib/stores/settings";
import { isNonMP4Video } from "@/lib/utils";
import { VideoCodecWarning } from "./video-codec-warning";

interface UrlPreviewDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    url: string;
    title: string;
}

export function UrlPreviewDialog({ open, onOpenChange, url, title }: UrlPreviewDialogProps) {
    const [error, setError] = useState(false);
    const [loading, setLoading] = useState(true);
    const [showCodecWarning, setShowCodecWarning] = useState(true);
    const { set } = useSettingsStore();

    const hasCodecIssue = isNonMP4Video(url);

    // Keyboard navigation
    useEffect(() => {
        if (!open) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                e.preventDefault();
                onOpenChange(false);
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [open, onOpenChange]);

    const handleLoad = () => {
        setLoading(false);
    };

    const handleError = () => {
        setError(true);
        setLoading(false);
    };

    const switchToPlayer = (player: MediaPlayer) => {
        set("mediaPlayer", player);
        setShowCodecWarning(false);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="sm:max-w-[95vw] h-[95vh] p-0 gap-0 flex flex-col overflow-hidden outline-none!"
                showCloseButton={false}>
                <DialogTitle className="sr-only">{title}</DialogTitle>
                {/* Header */}
                <div className="flex items-center justify-between p-3 sm:p-4 border-b shrink-0 bg-background">
                    <div className="flex-1 min-w-0 mr-4">
                        <h2 className="text-lg font-semibold truncate">{title}</h2>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onOpenChange(false)}
                            title="Close (Esc)"
                            aria-label="Close preview (Esc)">
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Preview Content */}
                <div className="flex-1 relative overflow-hidden min-h-0 bg-black" key={url}>
                    {loading && !error ? (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-white" />
                        </div>
                    ) : null}

                    {error ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-white">
                            <AlertCircle className="h-12 w-12 mb-2" />
                            <p className="text-sm">Failed to load video</p>
                            <p className="text-xs text-white/70 mt-1">{title}</p>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full">
                            <video
                                src={url}
                                controls
                                autoPlay
                                className="w-full h-full object-contain"
                                onLoadedData={handleLoad}
                                onError={handleError}
                            />
                        </div>
                    )}

                    {/* Codec Warning Banner */}
                    <VideoCodecWarning
                        show={hasCodecIssue && showCodecWarning}
                        onClose={() => setShowCodecWarning(false)}
                        onSwitchPlayer={switchToPlayer}
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
}
