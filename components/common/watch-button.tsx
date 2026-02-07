"use client";

import { memo, useCallback, type ReactElement } from "react";
import { Slot } from "@radix-ui/react-slot";
import { useStreamingStore, type StreamingRequest } from "@/lib/stores/streaming";
import { useUserAddons } from "@/hooks/use-addons";

interface WatchButtonProps {
    request: StreamingRequest;
    children: ReactElement<{ onClick?: React.MouseEventHandler; disabled?: boolean; "data-loading"?: boolean }>;
}

export const WatchButton = memo(function WatchButton({ request, children }: WatchButtonProps) {
    const play = useStreamingStore((s) => s.play);
    const activeRequest = useStreamingStore((s) => s.activeRequest);
    const { data: addons = [], isPending: isAddonsLoading } = useUserAddons();

    const isLoading =
        isAddonsLoading ||
        (activeRequest?.imdbId === request.imdbId &&
            activeRequest?.type === request.type &&
            activeRequest?.tvParams?.season === request.tvParams?.season &&
            activeRequest?.tvParams?.episode === request.tvParams?.episode);

    const handleClick = useCallback(
        (e: React.MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();
            if (isLoading) return;
            play(request, addons);
        },
        [play, request, addons, isLoading]
    );

    return (
        <Slot onClick={handleClick} data-loading={isLoading || undefined} data-disabled={isLoading || undefined}>
            {children}
        </Slot>
    );
});
