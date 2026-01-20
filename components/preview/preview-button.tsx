"use client";

import { Button } from "@/components/ui/button";
import { View } from "lucide-react";
import { DebridFileNode } from "@/lib/types";
import { usePreviewStore } from "@/lib/stores/preview";

interface PreviewButtonProps {
    node: DebridFileNode;
    allNodes: DebridFileNode[];
    fileId: string;
}

export function PreviewButton({ node, allNodes, fileId }: PreviewButtonProps) {
    const openPreview = usePreviewStore((state) => state.openPreview);

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        openPreview(node, allNodes, fileId);
    };

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
}
