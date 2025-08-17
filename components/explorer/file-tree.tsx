"use client";

import { useState, useCallback, useMemo } from "react";
import { DebridFileNode, DebridLinkInfo } from "@/lib/clients/types";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
    ChevronRight,
    Copy,
    Download,
    CirclePlay,
    Loader2,
} from "lucide-react";
import { cn, getFileType } from "@/lib/utils";
import {
    formatSize,
    playUrl,
    downloadLinks,
    copyLinksToClipboard,
} from "@/lib/utils";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
    TooltipProvider,
} from "@/components/ui/tooltip";
import { useQuery } from "@tanstack/react-query";
import { useAuthContext } from "@/lib/contexts/auth";
import { toast } from "sonner";
import { FileType } from "@/lib/types";
import { useSettingsStore } from "@/lib/stores/settings";
import { useIsMobile } from "@/hooks/use-mobile";
import { QUERY_CACHE_MAX_AGE } from "@/lib/constants";

interface FileTreeProps {
    nodes: DebridFileNode[];
    selectedFiles: Set<string>; // Set of file IDs
    onSelectionChange: (files: Set<string>) => void;
    fileId: string;
}

interface FileNodeProps {
    node: DebridFileNode;
    selectedFiles: Set<string>; // Set of file IDs
    onSelectionChange: (files: Set<string>) => void;
    fileId: string;
    depth: number;
}

function getAllFileIds(node: DebridFileNode): string[] {
    // If it's a file and has an ID, return it
    if (node.type === "file") {
        return node.id ? [node.id] : [];
    }

    // If it's a folder, recursively collect all file IDs from children
    const fileIds: string[] = [];
    for (const child of node.children) {
        fileIds.push(...getAllFileIds(child));
    }
    return fileIds;
}

function FileActionButton({
    node,
    action,
}: {
    node: DebridFileNode;
    action: "copy" | "download" | "play";
}) {
    const { client, currentUser } = useAuthContext();
    const [isButtonLoading, setIsButtonLoading] = useState(false);
    const { mediaPlayer } = useSettingsStore();

    const { data: linkInfo, refetch } = useQuery({
        queryKey: [currentUser.id, "getNodeDownloadUrl", node.id],
        queryFn: () => client.getNodeDownloadUrl(node.id!),
        enabled: false, // Don't auto-fetch
        staleTime: QUERY_CACHE_MAX_AGE,
    });

    const handleAction = async (linkInfo: DebridLinkInfo) => {
        if (!linkInfo) return;

        switch (action) {
            case "play":
                window.open(playUrl(linkInfo.link, mediaPlayer), "_self");
                break;
            case "download":
                downloadLinks([linkInfo]);
                break;
            case "copy":
                copyLinksToClipboard([linkInfo]);
                toast.success("Links copied to clipboard");
                break;
        }
    };

    const handleClick = async (e: React.MouseEvent) => {
        e.stopPropagation();

        // If we don't have linkInfo yet, fetch it
        if (!linkInfo) {
            setIsButtonLoading(true);
            try {
                const result = await refetch();
                if (!result.data) return;
                await handleAction(result.data);
            } finally {
                setIsButtonLoading(false);
            }
            return;
        }

        await handleAction(linkInfo);
    };

    const icon = useMemo(() => {
        if (isButtonLoading) {
            return (
                <Loader2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 animate-spin" />
            );
        }

        return {
            copy: <Copy className="h-3 w-3 sm:h-3.5 sm:w-3.5" />,
            download: <Download className="h-3 w-3 sm:h-3.5 sm:w-3.5" />,
            play: <CirclePlay className="h-3 w-3 sm:h-3.5 sm:w-3.5" />,
        }[action];
    }, [action, isButtonLoading]);

    return (
        <Button
            variant="ghost"
            size="icon"
            className="size-4 sm:size-6 cursor-pointer"
            onClick={handleClick}
            disabled={isButtonLoading || !node.id}
        >
            {icon}
        </Button>
    );
}

function FileNode({
    node,
    selectedFiles,
    onSelectionChange,
    fileId,
    depth,
    isFirst = false,
}: FileNodeProps & { isFirst?: boolean }) {
    const isMobile = useIsMobile();
    const [showActions, setShowActions] = useState(false);

    const [isOpen, setIsOpen] = useState(
        depth === 0 && isFirst && node.type === "folder"
    );

    const allFileIds = useMemo(() => {
        return getAllFileIds(node);
    }, [node]);

    const isSelected =
        allFileIds.length > 0 &&
        allFileIds.every((id) => selectedFiles.has(id));
    const isIndeterminate =
        !isSelected && allFileIds.some((id) => selectedFiles.has(id));

    const handleCheckboxChange = useCallback(
        (checked: boolean) => {
            const newSelection = new Set(selectedFiles);

            if (checked) {
                allFileIds.forEach((id) => newSelection.add(id));
            } else {
                allFileIds.forEach((id) => newSelection.delete(id));
            }

            onSelectionChange(newSelection);
        },
        [allFileIds, selectedFiles, onSelectionChange]
    );

    if (node.type === "file") {
        return (
            <div
                className={cn(
                    "flex items-center gap-1 sm:gap-2 py-0.5 sm:py-1 rounded px-1 sm:px-2 hover:bg-muted",
                    "text-xs sm:text-sm"
                )}
                style={{ paddingLeft: `${depth * 12}px` }}
            >
                <Checkbox
                    checked={isSelected}
                    onCheckedChange={handleCheckboxChange}
                    className="size-3 sm:size-4"
                />

                <TooltipProvider>
                    <Tooltip delayDuration={2000}>
                        <TooltipTrigger asChild>
                            <span
                                className="flex-1 cursor-pointer truncate"
                                onClick={() => {
                                    if (isMobile) {
                                        setShowActions(!showActions);
                                    } else {
                                        handleCheckboxChange(!isSelected);
                                    }
                                }}
                            >
                                {node.name}
                            </span>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{node.name}</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
                <span className="text-[10px] sm:text-xs text-muted-foreground">
                    {formatSize(node.size)}
                </span>
                {(!isMobile || showActions) && (
                    <div className="flex gap-1 md:gap-0.5">
                        {getFileType(node.name) === FileType.VIDEO && (
                            <FileActionButton node={node} action="play" />
                        )}
                        <FileActionButton node={node} action="copy" />
                        <FileActionButton node={node} action="download" />
                    </div>
                )}
            </div>
        );
    }

    return (
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <div className="flex flex-col">
                <CollapsibleTrigger asChild>
                    <div
                        className={cn(
                            "flex items-center gap-1 sm:gap-2 py-0.5 sm:py-1 rounded px-1 sm:px-2 cursor-pointer hover:bg-muted",
                            "text-xs sm:text-sm"
                        )}
                        style={{ paddingLeft: `${depth * 12}px` }}
                    >
                        <ChevronRight
                            className={cn(
                                "h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground transition-transform flex-shrink-0",
                                isOpen && "rotate-90"
                            )}
                        />
                        <Checkbox
                            checked={
                                isIndeterminate ? "indeterminate" : isSelected
                            }
                            onCheckedChange={handleCheckboxChange}
                            onClick={(e) => e.stopPropagation()}
                            className="h-3 w-3 sm:h-4 sm:w-4"
                        />
                        <TooltipProvider>
                            <Tooltip delayDuration={2000}>
                                <TooltipTrigger asChild>
                                    <span className="flex-1 cursor-pointer truncate">
                                        {node.name}
                                    </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{node.name}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                        <span className="text-[10px] sm:text-xs text-muted-foreground">
                            {node.children.length} items
                        </span>
                    </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                    <div className="flex flex-col">
                        {node.children.map((child, index) => (
                            <FileNode
                                key={
                                    child.id ||
                                    `${node.name}/${child.name}-${index}`
                                }
                                node={child}
                                selectedFiles={selectedFiles}
                                onSelectionChange={onSelectionChange}
                                fileId={fileId}
                                depth={depth + 1}
                            />
                        ))}
                    </div>
                </CollapsibleContent>
            </div>
        </Collapsible>
    );
}

export function FileTree({
    nodes,
    selectedFiles,
    onSelectionChange,
    fileId,
}: FileTreeProps) {
    return (
        <div className="flex flex-col">
            {nodes.map((node, index) => (
                <FileNode
                    key={node.id || `${node.name}-${index}`}
                    node={node}
                    selectedFiles={selectedFiles}
                    onSelectionChange={onSelectionChange}
                    fileId={fileId}
                    depth={0}
                    isFirst={index === 0}
                />
            ))}
        </div>
    );
}
