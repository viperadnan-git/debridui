"use client";

import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

interface FileListHeaderProps {
    isAllSelected: boolean | "indeterminate";
    onSelectAll: (checked: boolean | "indeterminate") => void;
    className?: string;
}

export function FileListHeader({ 
    isAllSelected, 
    onSelectAll, 
    className 
}: FileListHeaderProps) {
    return (
        <div className={cn(
            "flex items-center gap-1 sm:gap-2 md:gap-3",
            "px-1 sm:px-2 md:px-4",
            "py-1 sm:py-1.5 md:py-2",
            "border-b border-border",
            "bg-muted/30",
            "text-xs sm:text-sm font-medium text-muted-foreground",
            className
        )}>
            <div className="flex-shrink-0">
                <Checkbox
                    checked={isAllSelected}
                    onCheckedChange={(checked) => {
                        if (checked === "indeterminate") {
                            onSelectAll(false);
                        } else {
                            onSelectAll(checked);
                        }
                    }}
                />
            </div>
            
            <div className="flex-1 min-w-0">
                <span className="hidden sm:inline">File Details</span>
                <span className="sm:hidden">Files</span>
            </div>
        </div>
    );
}