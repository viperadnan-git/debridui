"use client";

import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

interface FileListHeaderProps {
    isAllSelected: boolean | "indeterminate";
    onSelectAll: (checked: boolean | "indeterminate") => void;
    selectedCount?: number;
    currentPage?: number;
    onRefresh?: () => void;
    isRefreshing?: boolean;
    className?: string;
}

export function FileListHeader({
    isAllSelected,
    onSelectAll,
    selectedCount = 0,
    currentPage = 1,
    onRefresh,
    isRefreshing = false,
    className,
}: FileListHeaderProps) {
    const title = currentPage > 1 ? `Page ${currentPage}` : "Files";
    return (
        <div
            className={cn(
                "flex items-center gap-1 sm:gap-2 md:gap-3 px-1 sm:px-2 md:px-4 py-1 sm:py-1.5 md:py-2 border-b border-border/50 bg-muted/20 text-xs sm:text-sm font-medium text-muted-foreground",
                className
            )}>
            <div className="shrink-0 px-1">
                <Checkbox
                    checked={isAllSelected}
                    onCheckedChange={(checked) => {
                        if (isAllSelected === "indeterminate" || isAllSelected === true) {
                            onSelectAll(false);
                        } else {
                            onSelectAll(checked);
                        }
                    }}
                />
            </div>

            <div className="flex flex-1 items-center min-w-0 justify-between gap-2 pr-1 sm:pr-2">
                <span>
                    {selectedCount > 0 ? <span className="text-foreground">{selectedCount} Selected</span> : title}
                </span>
                {onRefresh && (
                    <Button
                        onClick={onRefresh}
                        disabled={isRefreshing}
                        variant="ghost"
                        size="icon"
                        aria-label="Refresh"
                        className="size-5 -mr-1 text-muted-foreground hover:text-muted-foreground">
                        <RefreshCw className={cn("size-3.5!", isRefreshing && "animate-spin")} />
                    </Button>
                )}
            </div>
        </div>
    );
}
