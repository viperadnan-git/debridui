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
            <Button size="sm" onClick={handlePlay} title="Play">
                <PlayIcon className="size-4" />
                Play
            </Button>
        );
    },
    (prev, next) => prev.url === next.url && prev.title === next.title && prev.onOpenPreview === next.onOpenPreview
);
