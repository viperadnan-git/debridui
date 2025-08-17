"use client";

import React, { useCallback } from "react";
import { DebridFile } from "@/lib/types";
import { Checkbox } from "@/components/ui/checkbox";
import { formatSize, formatRelativeTime, formatSpeed, cn } from "@/lib/utils";
import { StatusBadge } from "../display";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "../ui/separator";

interface FileListItemProps {
    file: DebridFile;
    isSelected: boolean | "indeterminate";
    canExpand: boolean;
    onToggleSelect: (checked: boolean | "indeterminate") => void;
    onToggleExpand: () => void;
    className?: string;
}

export function FileListItem({
    file,
    isSelected,
    canExpand,
    onToggleSelect,
    onToggleExpand,
    className,
}: FileListItemProps) {
    // Format size with progress for active transfers
    const getSizeDisplay = useCallback(() => {
        if (file.status === "downloading" && file.downloaded !== undefined) {
            return `${formatSize(file.size)} | DL: ${formatSize(file.downloaded)}`;
        } else if (file.status === "uploading" && file.uploaded !== undefined) {
            return `${formatSize(file.size)} | UL: ${formatSize(file.uploaded)}`;
        }
        return formatSize(file.size);
    }, [file]);

    // Desktop second row content
    const getDesktopSecondRow = useCallback(() => {
        const elements = [];

        if (file.peers !== undefined) {
            elements.push(<span key="peers">Peers: {file.peers}</span>);
        }

        // Speed indicator for active transfers
        if (file.status === "downloading" && file.downloadSpeed) {
            elements.push(
                <TooltipProvider key="dl-speed">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <span className="text-blue-600">
                                Speed: {formatSpeed(file.downloadSpeed)}
                            </span>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Download speed</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            );
        } else if (file.status === "uploading" && file.uploadSpeed) {
            elements.push(
                <TooltipProvider key="ul-speed">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <span className="text-green-600">
                                Speed: {formatSpeed(file.uploadSpeed)}
                            </span>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Upload speed</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            );
        }

        if (file.error) {
            elements.push(
                <span key="error" className="truncate max-w-[200px]">
                    {file.error}
                </span>
            );
        }

        // Join elements with separators
        return elements.reduce((acc: React.ReactNode[], elem, index) => {
            if (index > 0) {
                acc.push(
                    <Separator
                        orientation="vertical"
                        key={`sep-${index}`}
                        className="h-4 bg-muted-foreground/20"
                    />
                );
            }
            acc.push(elem);
            return acc;
        }, []);
    }, [file]);

    const getTimeDisplay = useCallback(() => {
        return (
            <TooltipProvider key="completed">
                <Tooltip delayDuration={2000}>
                    <TooltipTrigger asChild>
                        <span className="cursor-pointer">
                            {formatRelativeTime(
                                file.completedAt || file.createdAt
                            )}
                        </span>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>
                            {file.status === "completed"
                                ? "Completed"
                                : "Added"}{" "}
                            {(
                                file.completedAt || file.createdAt
                            ).toLocaleString()}
                        </p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    }, [file]);

    return (
        <div
            className={cn(
                "flex items-center gap-1 sm:gap-2 md:gap-3 px-1 sm:px-2 md:px-4 py-1.5 sm:py-2 md:py-3 border-b border-border/40 transition-colors duration-150 bg-card",
                canExpand && "cursor-pointer hover:bg-card/50",
                className
            )}
            onClick={() => canExpand && onToggleExpand()}
        >
            <div className="flex-shrink-0 px-1">
                <Checkbox
                    checked={isSelected}
                    onCheckedChange={onToggleSelect}
                    onClick={(e) => e.stopPropagation()}
                />
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex flex-col gap-0.5">
                    <div className="flex justify-between gap-1">
                        <div
                            className={cn(
                                "text-sm font-medium truncate",
                                file.status === "completed" && "cursor-pointer"
                            )}
                        >
                            {file.name}
                        </div>
                        <div className="flex items-center gap-1">
                            {file.progress !== undefined && (
                                <span className="text-sm">
                                    {file.progress || "0"}%
                                </span>
                            )}
                            &nbsp;
                            <StatusBadge
                                status={file.status}
                                hide={"completed"}
                            />
                        </div>
                    </div>

                    {/* Row 2: Everything else */}
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        {<span key="size">Size: {getSizeDisplay()}</span>}
                        {getDesktopSecondRow()}
                        <span className="flex-1"></span>
                        {getTimeDisplay()}
                    </div>
                </div>
            </div>
        </div>
    );
}
