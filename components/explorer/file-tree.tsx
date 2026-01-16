"use client";

import { useState, useCallback, useMemo, useRef } from "react";
import { DebridFileNode, DebridLinkInfo } from "@/lib/types";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { ChevronRight, Copy, Download, CirclePlay, Loader2 } from "lucide-react";
import { cn, getFileType } from "@/lib/utils";
import { formatSize, playUrl, downloadLinks, copyLinksToClipboard } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { useQuery } from "@tanstack/react-query";
import { useAuthContext } from "@/lib/contexts/auth";
import { toast } from "sonner";
import { FileType, MediaPlayer } from "@/lib/types";
import { useSettingsStore } from "@/lib/stores/settings";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSelectionStore } from "@/lib/stores/selection";
import { FixedSizeList as List, ListChildComponentProps } from "react-window";
import { PreviewButton } from "@/components/preview/preview-button";

interface FileTreeProps {
    nodes: DebridFileNode[];
    fileId: string;
}

interface FlatNode {
    node: DebridFileNode;
    depth: number;
    hasChildren: boolean;
    path: string;
}

// Helper to flatten tree for virtualization
function flattenNodes(nodes: DebridFileNode[], expandedPaths: Set<string>, depth = 0): FlatNode[] {
    const flat: FlatNode[] = [];

    for (const node of nodes) {
        const path = `${depth}-${node.id || node.name}`;
        flat.push({
            node,
            depth,
            hasChildren: node.type === "folder" && node.children.length > 0,
            path,
        });

        // Add children if expanded
        if (node.type === "folder" && node.children.length > 0 && expandedPaths.has(path)) {
            flat.push(...flattenNodes(node.children, expandedPaths, depth + 1));
        }
    }

    return flat;
}

// Helper to collect all node IDs in the correct order
function collectNodeIds(node: DebridFileNode): string[] {
    if (node.type === "file") {
        return node.id ? [node.id] : [];
    }

    const ids: string[] = [];

    // Use a recursive approach to preserve order instead of stack
    const collectRecursively = (currentNode: DebridFileNode) => {
        if (currentNode.type === "file" && currentNode.id) {
            ids.push(currentNode.id);
        } else if (currentNode.children) {
            // Process children in order
            for (const child of currentNode.children) {
                collectRecursively(child);
            }
        }
    };

    collectRecursively(node);
    return ids;
}

// Count total nodes recursively
function countTotalNodes(nodes: DebridFileNode[]): number {
    let count = 0;
    const stack = [...nodes];

    while (stack.length > 0) {
        const node = stack.pop()!;
        count++;
        if (node.children) {
            stack.push(...node.children);
        }
    }

    return count;
}

// Helper to collect all file nodes (not folders) from the tree in display order
function collectAllFileNodes(nodes: DebridFileNode[]): DebridFileNode[] {
    const files: DebridFileNode[] = [];
    const stack: DebridFileNode[] = [...nodes].reverse();

    while (stack.length > 0) {
        const node = stack.pop()!;
        if (node.type === "file") {
            files.push(node);
        } else if (node.children && node.children.length > 0) {
            // Push children in reverse order to maintain display order when popped
            for (let i = node.children.length - 1; i >= 0; i--) {
                stack.push(node.children[i]);
            }
        }
    }

    return files;
}

function FileActionButton({ node, action }: { node: DebridFileNode; action: "copy" | "download" | "play" }) {
    const { client, currentUser } = useAuthContext();
    const [isButtonLoading, setIsButtonLoading] = useState(false);
    const { get } = useSettingsStore();
    const mediaPlayer = get("mediaPlayer");
    const downloadLinkMaxAge = get("downloadLinkMaxAge");

    const { data: linkInfo, refetch } = useQuery({
        queryKey: [currentUser.id, "getDownloadLink", node.id],
        queryFn: () => client.getDownloadLink(node.id!),
        enabled: false,
        gcTime: downloadLinkMaxAge,
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
            return <Loader2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 animate-spin" />;
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
            disabled={isButtonLoading || !node.id}>
            {icon}
        </Button>
    );
}

interface VirtualizedNodeProps {
    flatNode: FlatNode;
    fileId: string;
    expandedPaths: Set<string>;
    onToggleExpand: (path: string) => void;
    allFileNodes: DebridFileNode[];
}

function VirtualizedNode({ flatNode, fileId, expandedPaths, onToggleExpand, allFileNodes }: VirtualizedNodeProps) {
    const { node, depth, hasChildren, path } = flatNode;
    const isExpanded = expandedPaths.has(path);
    const isMobile = useIsMobile();
    const [showActions, setShowActions] = useState(false);
    const mediaPlayer = useSettingsStore((state) => state.get("mediaPlayer"));

    const selectedNodes = useSelectionStore((state) => state.selectedNodesByFile.get(fileId));
    const updateNodeSelection = useSelectionStore((state) => state.updateNodeSelection);
    const selectedFiles = useMemo(() => selectedNodes || new Set<string>(), [selectedNodes]);

    const allFileIds = useMemo(() => collectNodeIds(node), [node]);
    const isSelected = allFileIds.length > 0 && allFileIds.every((id) => selectedFiles.has(id));
    const isIndeterminate = !isSelected && allFileIds.some((id) => selectedFiles.has(id));

    const handleCheckboxChange = useCallback(
        (checked: boolean) => {
            const newSelection = new Set<string>(selectedFiles);
            if (checked) {
                allFileIds.forEach((id) => newSelection.add(id));
            } else {
                allFileIds.forEach((id) => newSelection.delete(id));
            }
            updateNodeSelection(fileId, newSelection);
        },
        [allFileIds, selectedFiles, updateNodeSelection, fileId]
    );

    const isFile = node.type === "file";

    return (
        <div
            className={cn(
                "flex items-center gap-1 sm:gap-2 py-0.5 sm:py-1 rounded hover:bg-muted",
                "text-xs sm:text-sm",
                hasChildren && "cursor-pointer"
            )}
            style={{ paddingLeft: `${(depth - 1) * 12 + 8}px` }}
            onClick={() => hasChildren && onToggleExpand(path)}>
            {hasChildren && (
                <ChevronRight
                    className={cn(
                        "h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground transition-transform shrink-0",
                        isExpanded && "rotate-90"
                    )}
                />
            )}

            <Checkbox
                checked={isIndeterminate ? "indeterminate" : isSelected}
                onCheckedChange={(checked) => handleCheckboxChange(checked === true)}
                onClick={(e) => e.stopPropagation()}
                className="size-3 sm:size-4"
            />

            <TooltipProvider>
                <Tooltip delayDuration={2000}>
                    <TooltipTrigger asChild>
                        <span
                            className="flex-1 cursor-pointer truncate"
                            onClick={(e) => {
                                if (isFile) {
                                    e.stopPropagation();
                                    if (isMobile) {
                                        setShowActions(!showActions);
                                    } else {
                                        handleCheckboxChange(!isSelected);
                                    }
                                }
                            }}>
                            {node.name}
                        </span>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{node.name}</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>

            {isFile ? (
                <>
                    <span className="text-[10px] sm:text-xs text-muted-foreground">{formatSize(node.size)}</span>
                    {(!isMobile || showActions) && (
                        <div className="flex gap-1 md:gap-0.5">
                            {getFileType(node.name) === FileType.VIDEO &&
                                (mediaPlayer === MediaPlayer.BROWSER ? (
                                    <PreviewButton node={node} allNodes={allFileNodes} fileId={fileId} />
                                ) : (
                                    <FileActionButton node={node} action="play" />
                                ))}
                            {getFileType(node.name) === FileType.IMAGE && (
                                <PreviewButton node={node} allNodes={allFileNodes} fileId={fileId} />
                            )}
                            <FileActionButton node={node} action="copy" />
                            <FileActionButton node={node} action="download" />
                        </div>
                    )}
                </>
            ) : (
                <span className="text-[10px] sm:text-xs text-muted-foreground">{node.children.length} items</span>
            )}
        </div>
    );
}

const VIRTUALIZATION_THRESHOLD = 200; // Use virtualization above this many nodes

export function FileTree({ nodes, fileId }: FileTreeProps) {
    const isMobile = useIsMobile();
    const [expandedPaths, setExpandedPaths] = useState<Set<string>>(() => {
        // Auto-expand first folder if it's the only top-level item
        if (nodes.length === 1 && nodes[0].type === "folder") {
            return new Set([`0-${nodes[0].id || nodes[0].name}`]);
        }
        return new Set();
    });

    const listRef = useRef<List>(null);

    // Count total nodes to decide if virtualization is needed
    const totalNodeCount = useMemo(() => countTotalNodes(nodes), [nodes]);
    const useVirtualization = totalNodeCount > VIRTUALIZATION_THRESHOLD;

    // Flatten nodes for virtualization
    const flatNodes = useMemo(() => {
        return flattenNodes(nodes, expandedPaths);
    }, [nodes, expandedPaths]);

    // Collect all file nodes for preview navigation
    const allFileNodes = useMemo(() => {
        return collectAllFileNodes(nodes);
    }, [nodes]);

    const toggleExpanded = useCallback((path: string) => {
        setExpandedPaths((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(path)) {
                newSet.delete(path);
            } else {
                newSet.add(path);
            }
            return newSet;
        });
    }, []);

    // Row renderer for react-window
    const rowRenderer = useCallback(
        (props: ListChildComponentProps) => {
            const flatNode = flatNodes[props.index];
            if (!flatNode) return null;

            // Type workaround for react-window style conflicts
            const divStyle = props.style;

            return (
                <div style={divStyle} className="px-3 md:px-4">
                    <VirtualizedNode
                        flatNode={flatNode}
                        fileId={fileId}
                        expandedPaths={expandedPaths}
                        onToggleExpand={toggleExpanded}
                        allFileNodes={allFileNodes}
                    />
                </div>
            );
        },
        [flatNodes, fileId, expandedPaths, toggleExpanded, allFileNodes]
    );

    // Regular rendering for small trees
    if (!useVirtualization) {
        return (
            <div className="flex flex-col px-3 md:px-4 p-2 md:p-3 gap-1">
                {flatNodes.map((flatNode, index) => (
                    <VirtualizedNode
                        key={flatNode.node.id || `${flatNode.path}-${index}`}
                        flatNode={flatNode}
                        fileId={fileId}
                        expandedPaths={expandedPaths}
                        onToggleExpand={toggleExpanded}
                        allFileNodes={allFileNodes}
                    />
                ))}
            </div>
        );
    }

    // Virtualized rendering with react-window for large trees
    const itemSize = isMobile ? 30 : 36;
    const maxHeight = 600;
    const totalContentHeight = flatNodes.length * itemSize;
    const listHeight = Math.min(totalContentHeight, maxHeight);

    return (
        <div className="pt-2 md:pt-3">
            <List
                ref={listRef}
                height={listHeight}
                itemCount={flatNodes.length}
                itemSize={itemSize}
                width="100%"
                overscanCount={10}
                className="outline-none!">
                {rowRenderer}
            </List>
        </div>
    );
}
