"use client";

import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { QuickSettings } from "./quick-settings";

interface FileListHeaderProps {
    isAllSelected: boolean | "indeterminate";
    onSelectAll: (checked: boolean | "indeterminate") => void;
    className?: string;
}

export function FileListHeader({ isAllSelected, onSelectAll, className }: FileListHeaderProps) {
    return (
        <div
            className={cn(
                "flex items-center gap-1 sm:gap-2 md:gap-3 px-1 sm:px-2 md:px-4 py-1 sm:py-1.5 md:py-2 border-b border-border bg-muted/30 text-xs sm:text-sm font-medium text-muted-foreground",
                className
            )}>
            <div className="shrink-0 px-1">
                <Checkbox
                    checked={isAllSelected}
                    onCheckedChange={(checked) => {
                        // If some or all files are already selected, unselect all
                        // Only select all when nothing is selected
                        if (isAllSelected === "indeterminate" || isAllSelected === true) {
                            onSelectAll(false);
                        } else {
                            onSelectAll(checked);
                        }
                    }}
                />
            </div>

            <div className="flex flex-1 items-center min-w-0 justify-between pr-2">
                <span>Files</span>
                <QuickSettings />
            </div>
        </div>
    );
}
