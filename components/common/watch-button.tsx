"use client";

import { memo, useCallback, type ReactElement } from "react";
import { Slot } from "@radix-ui/react-slot";
import { useStreamingStore } from "@/lib/stores/streaming";
import { useUserAddons } from "@/hooks/use-addons";
import { type TvSearchParams } from "@/lib/addons/types";

interface WatchButtonProps {
    imdbId: string;
    mediaType: "movie" | "show";
    title: string;
    tvParams?: TvSearchParams;
    children: ReactElement<{ onClick?: React.MouseEventHandler; disabled?: boolean; "data-loading"?: boolean }>;
}

export const WatchButton = memo(function WatchButton({
    imdbId,
    mediaType,
    title,
    tvParams,
    children,
}: WatchButtonProps) {
    const play = useStreamingStore((s) => s.play);
    const activeRequest = useStreamingStore((s) => s.activeRequest);
    const { data: addons = [], isPending: isAddonsLoading } = useUserAddons();

    const isLoading =
        isAddonsLoading ||
        (activeRequest?.imdbId === imdbId &&
            activeRequest?.type === mediaType &&
            activeRequest?.tvParams?.season === tvParams?.season &&
            activeRequest?.tvParams?.episode === tvParams?.episode);

    const handleClick = useCallback(
        (e: React.MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();
            if (isLoading) return;
            play({ imdbId, type: mediaType, title, tvParams }, addons);
        },
        [play, imdbId, mediaType, title, tvParams, addons, isLoading]
    );

    return (
        <Slot onClick={handleClick} data-loading={isLoading || undefined} data-disabled={isLoading || undefined}>
            {children}
        </Slot>
    );
});
