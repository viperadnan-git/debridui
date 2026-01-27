"use client";

import { memo } from "react";
import { Button } from "@/components/ui/button";
import { PlayIcon } from "lucide-react";
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
            <Button size="sm" onClick={handlePlay} className="h-7 gap-1.5 px-2.5 text-xs" title="Play">
                <PlayIcon className="size-3" />
                <span>Play</span>
            </Button>
        );
    },
    (prev, next) => prev.url === next.url && prev.title === next.title && prev.onOpenPreview === next.onOpenPreview
);
