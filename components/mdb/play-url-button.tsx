"use client";

import { memo } from "react";
import { Button } from "@/components/ui/button";
import { CirclePlay } from "lucide-react";
import { playUrl } from "@/lib/utils/media-player";

interface PlayUrlButtonProps {
    url: string;
    title: string;
    onOpenPreview?: (url: string, title: string) => void;
}

export const PlayUrlButton = memo(
    function PlayUrlButton({ url, title, onOpenPreview }: PlayUrlButtonProps) {
        const handlePlay = () => {
            if (onOpenPreview) {
                onOpenPreview(url, title);
            } else {
                playUrl({ url, fileName: title });
            }
        };

        return (
            <Button size="sm" variant="default" onClick={handlePlay} className="h-8 gap-1.5 px-3" title="Play">
                <CirclePlay className="h-4 w-4" />
                <span>Play</span>
            </Button>
        );
    },
    (prev, next) => prev.url === next.url && prev.title === next.title && prev.onOpenPreview === next.onOpenPreview
);
