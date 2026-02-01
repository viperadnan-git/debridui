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
    const { data: addons = [] } = useUserAddons();

    const isLoading =
        activeRequest?.imdbId === imdbId &&
        activeRequest?.type === mediaType &&
        activeRequest?.tvParams?.season === tvParams?.season &&
        activeRequest?.tvParams?.episode === tvParams?.episode;

    const handleClick = useCallback(
        (e: React.MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();
            if (useStreamingStore.getState().activeRequest) return;
            const enabledAddons = addons
                .filter((a) => a.enabled)
                .sort((a, b) => a.order - b.order)
                .map((a) => ({ id: a.id, url: a.url, name: a.name }));
            play({ imdbId, type: mediaType, title, tvParams }, enabledAddons);
        },
        [play, imdbId, mediaType, title, tvParams, addons]
    );

    return (
        <Slot onClick={handleClick} data-loading={isLoading || undefined} data-disabled={isLoading || undefined}>
            {children}
        </Slot>
    );
});
