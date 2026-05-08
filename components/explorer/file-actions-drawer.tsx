"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Trash2, RotateCcw, X, Copy, Download, ListMusic, Loader2, type LucideIcon } from "lucide-react";
import { DebridFile } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useShallow } from "zustand/react/shallow";
import { useSelectionStore } from "@/lib/stores/selection";
import { useFileMutationActions, useFileLinkActions } from "@/hooks/use-file-actions";

interface FileActionsDrawerProps {
    files: DebridFile[];
}

export function FileActionsDrawer({ files }: FileActionsDrawerProps) {
    const { selectedFileIds, selectedNodesByFile, totalNodesByFile, clearAll } = useSelectionStore(
        useShallow((state) => ({
            selectedFileIds: state.selectedFileIds,
            selectedNodesByFile: state.selectedNodesByFile,
            totalNodesByFile: state.totalNodesByFile,
            clearAll: state.clearAll,
        }))
    );

    const selectedNodeIds = useMemo(() => {
        const allNodes = new Set<string>();
        for (const nodeSet of selectedNodesByFile.values()) {
            for (const id of nodeSet) {
                allNodes.add(id);
            }
        }
        return allNodes;
    }, [selectedNodesByFile]);

    const selectedNodeIdsArray = useMemo(() => Array.from(selectedNodeIds), [selectedNodeIds]);

    const fullySelectedFileIds = useMemo(() => {
        return Array.from(selectedFileIds).filter((fileId) => {
            const selectedNodes = selectedNodesByFile.get(fileId);
            const totalNodes = totalNodesByFile.get(fileId) || 0;
            return totalNodes === 0 || (selectedNodes && selectedNodes.size === totalNodes);
        });
    }, [selectedFileIds, selectedNodesByFile, totalNodesByFile]);

    const hasAnySelection = selectedFileIds.size > 0 || selectedNodeIds.size > 0;
    const hasNodes = selectedNodeIds.size > 0;

    const { fullySelectedFiles, canRetry } = useMemo(() => {
        const fullySelectedFiles = files.filter((file) => fullySelectedFileIds.includes(file.id));
        const allSelectedAreFailed =
            fullySelectedFiles.length > 0 && fullySelectedFiles.every((file) => file.status === "failed");

        return {
            fullySelectedFiles,
            canRetry: allSelectedAreFailed ? fullySelectedFiles : [],
        };
    }, [files, fullySelectedFileIds]);

    const { deleteMutation, retryMutation } = useFileMutationActions();
    const { copyMutation, downloadMutation, playlistMutation } = useFileLinkActions(selectedNodeIdsArray);

    const hasFileActions = canRetry.length > 0 || fullySelectedFiles.length > 0;
    const summaryParts: { count: number; unit: string }[] = [];
    if (hasNodes) summaryParts.push({ count: selectedNodeIds.size, unit: "link" });
    if (fullySelectedFiles.length > 0) summaryParts.push({ count: fullySelectedFiles.length, unit: "file" });
    const summaryAria =
        summaryParts.map((p) => `${p.count} ${p.unit}${p.count === 1 ? "" : "s"}`).join(" and ") + " selected";

    return (
        <>
            {/* Spacer keeps page content from sitting under the floating bar */}
            <div
                aria-hidden
                className={cn("transition-[height] duration-300 ease-in-out", hasAnySelection ? "h-20" : "h-0")}
            />

            <TooltipProvider delayDuration={250}>
                <div
                    role="region"
                    aria-label="Selection actions"
                    className={cn(
                        "fixed left-1/2 z-40",
                        // Float above the mobile tab bar; small inset on desktop
                        "bottom-[calc(56px+env(safe-area-inset-bottom)+0.75rem)] md:bottom-6",
                        // Width: full-bleed minus padding on mobile, hug content with a min width on desktop
                        "w-[calc(100vw-1.5rem)] md:w-auto md:min-w-[24rem]",
                        "transition-[opacity,transform] duration-300 ease-out",
                        // Center against the SidebarInset on desktop by offsetting by half the sidebar width
                        "-translate-x-1/2",
                        "md:translate-x-[calc(-50%+var(--sidebar-width)/2)]",
                        "md:group-has-data-[state=collapsed]/sidebar-wrapper:translate-x-[calc(-50%+var(--sidebar-width-icon)/2)]",
                        hasAnySelection ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0 pointer-events-none"
                    )}>
                    <div
                        className={cn(
                            "flex items-center h-12 gap-1 px-1.5",
                            "bg-background/95 backdrop-blur-md backdrop-saturate-150",
                            "border border-border/60 rounded-sm shadow-lg",
                            "supports-[backdrop-filter]:bg-background/80"
                        )}>
                        {/* Selection summary — single source of truth for counts */}
                        <div
                            aria-label={summaryAria}
                            title={summaryAria}
                            className="flex items-center gap-1.5 pl-2.5 pr-2 sm:gap-2 sm:pr-3 min-w-0 whitespace-nowrap">
                            {summaryParts.map((part, i) => {
                                const isPrimary = i === 0;
                                return (
                                    <span key={part.unit} className="flex items-center gap-1.5">
                                        {i > 0 && (
                                            <span className="text-border" aria-hidden>
                                                ·
                                            </span>
                                        )}
                                        <span
                                            className={cn(
                                                "tabular-nums text-sm font-medium",
                                                isPrimary
                                                    ? "text-foreground"
                                                    : "text-muted-foreground sm:text-foreground"
                                            )}>
                                            {part.count}
                                        </span>
                                        <span className="hidden sm:inline text-[11px] tracking-widest uppercase text-muted-foreground font-light">
                                            {part.unit}
                                            {part.count === 1 ? "" : "s"}
                                        </span>
                                    </span>
                                );
                            })}
                        </div>

                        <div className="h-5 w-px bg-border/60 shrink-0" />

                        {/* Link-level actions — scroll horizontally on narrow screens */}
                        {hasNodes && (
                            <div className="flex items-center gap-0.5 min-w-0 overflow-x-auto scrollbar-none">
                                <ActionButton
                                    label="Copy links"
                                    icon={Copy}
                                    isPending={copyMutation.isPending}
                                    onClick={() => copyMutation.mutate()}
                                />
                                <ActionButton
                                    label="Download"
                                    icon={Download}
                                    isPending={downloadMutation.isPending}
                                    onClick={() => downloadMutation.mutate()}
                                />
                                <ActionButton
                                    label="Download M3U playlist"
                                    icon={ListMusic}
                                    isPending={playlistMutation.isPending}
                                    onClick={() => playlistMutation.mutate()}
                                />
                            </div>
                        )}

                        {/* File-level actions — pushed to the end */}
                        {hasFileActions && (
                            <div className="flex items-center gap-0.5 ml-auto shrink-0">
                                {hasNodes && <div className="h-5 w-px bg-border/40 mx-1 shrink-0" />}
                                {canRetry.length > 0 && (
                                    <ActionButton
                                        label="Retry failed"
                                        icon={RotateCcw}
                                        isPending={retryMutation.isPending}
                                        onClick={() => retryMutation.mutate(canRetry.map((f) => f.id))}
                                    />
                                )}
                                {fullySelectedFiles.length > 0 && (
                                    <ActionButton
                                        label="Delete"
                                        icon={Trash2}
                                        destructive
                                        isPending={deleteMutation.isPending}
                                        onClick={() => deleteMutation.mutate(fullySelectedFiles.map((f) => f.id))}
                                    />
                                )}
                            </div>
                        )}

                        {/* Clear — sits at the very end; takes ml-auto when no file actions are present */}
                        <div className={cn("pl-1 border-l border-border/60 shrink-0", !hasFileActions && "ml-auto")}>
                            <ActionButton
                                label="Clear selection"
                                icon={X}
                                onClick={clearAll}
                                className="text-muted-foreground hover:text-foreground"
                            />
                        </div>
                    </div>
                </div>
            </TooltipProvider>
        </>
    );
}

interface ActionButtonProps {
    label: string;
    icon: LucideIcon;
    isPending?: boolean;
    onClick: () => void;
    destructive?: boolean;
    className?: string;
}

function ActionButton({ label, icon: Icon, isPending, onClick, destructive, className }: ActionButtonProps) {
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    aria-label={label}
                    disabled={isPending}
                    onClick={onClick}
                    className={cn(
                        "size-9 shrink-0",
                        destructive && "text-destructive hover:bg-destructive/10 hover:text-destructive",
                        className
                    )}>
                    {isPending ? <Loader2 className="size-4 animate-spin" /> : <Icon className="size-4" />}
                </Button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
                {label}
            </TooltipContent>
        </Tooltip>
    );
}
