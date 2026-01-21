"use client";

import { memo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { View } from "lucide-react";
import { DebridFileNode } from "@/lib/types";
import { usePreviewStore } from "@/lib/stores/preview";

interface PreviewButtonProps {
    node: DebridFileNode;
    allNodes: DebridFileNode[];
    fileId: string;
}

export const PreviewButton = memo(function PreviewButton({ node, allNodes, fileId }: PreviewButtonProps) {
    const openPreview = usePreviewStore((state) => state.openPreview);

    const handleClick = useCallback(
        (e: React.MouseEvent) => {
            e.stopPropagation();
            openPreview(node, allNodes, fileId);
        },
        [node, allNodes, fileId, openPreview]
    );

    return (
        <Button
            variant="ghost"
            size="icon"
            className="size-4 sm:size-6 cursor-pointer"
            onClick={handleClick}
            title="Preview">
            <View className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
        </Button>
    );
});
