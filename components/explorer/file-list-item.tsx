"use client";

import React, { Fragment, useMemo } from "react";
import { DebridFile } from "@/lib/types";
import { Checkbox } from "@/components/ui/checkbox";
import { formatSize, formatRelativeTime, formatSpeed, cn } from "@/lib/utils";
import { StatusBadge } from "../display";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { FileItemContextMenu } from "./file-item-context-menu";
import { Badge } from "../ui/badge";

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
    const getSizeDisplay = useMemo(() => {
        if (file.status === "downloading" && file.downloaded !== undefined) {
            return (
                <Fragment>
                    <span>Size: {formatSize(file.size)}</span>
                    <span>|</span>
                    <span>DL: {formatSize(file.downloaded)}</span>
                </Fragment>
            );
        } else if (file.status === "uploading" && file.uploaded !== undefined) {
            return (
                <Fragment>
                    <span>Size: {formatSize(file.size)}</span>
                    <span>|</span>
                    <span>UL: {formatSize(file.uploaded)}</span>
                </Fragment>
            );
        }
        return (
            <Fragment>
                <span>Size: {formatSize(file.size)}</span>
            </Fragment>
        );
    }, [file.status, file.size, file.downloaded, file.uploaded]);

    const getDesktopSecondRow = useMemo(() => {
        const elements = [];

        if (file.status !== "completed" && file.peers !== undefined) {
            elements.push(<span key="peers">Peers: {file.peers}</span>);
        }

        // Speed indicator for active transfers
        if (file.status === "downloading" && file.downloadSpeed) {
            elements.push(
                <TooltipProvider key="dl-speed">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <span className="text-blue-600">Speed: {formatSpeed(file.downloadSpeed)}</span>
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
                            <span className="text-green-600">Speed: {formatSpeed(file.uploadSpeed)}</span>
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
            acc.push(<span key={`sep-${index}`}>|</span>);
            acc.push(elem);
            return acc;
        }, []);
    }, [file.peers, file.status, file.downloadSpeed, file.uploadSpeed, file.error]);

    const getTimeDisplay = useMemo(() => {
        return (
            <TooltipProvider key="completed">
                <Tooltip delayDuration={2000}>
                    <TooltipTrigger asChild>
                        <span className="cursor-pointer">{formatRelativeTime(file.completedAt || file.createdAt)}</span>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>
                            {file.status === "completed" ? "Completed" : "Added"}{" "}
                            {(file.completedAt || file.createdAt).toLocaleString()}
                        </p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    }, [file.status, file.completedAt, file.createdAt]);

    return (
        <FileItemContextMenu file={file}>
            <div
                className={cn(
                    "flex items-center gap-1 sm:gap-2 md:gap-3 px-1 sm:px-2 md:px-4 py-1.5 sm:py-2 md:py-3 border-b border-border/40 transition-colors duration-150 bg-card",
                    canExpand && "cursor-pointer hover:bg-card/50",
                    className
                )}
                onClick={canExpand ? onToggleExpand : undefined}>
                <div className="shrink-0 px-1">
                    <Checkbox
                        checked={isSelected}
                        onCheckedChange={onToggleSelect}
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>

                <div className="flex-1 min-w-0 pe-2">
                    <div className="flex flex-col gap-0.5">
                        <div className="flex justify-between gap-1">
                            <div
                                className={cn(
                                    "text-sm font-medium truncate",
                                    file.status === "completed" && "cursor-pointer"
                                )}>
                                {file.name}
                            </div>
                            <div className="flex items-center gap-1">
                                {file.progress !== undefined && file.status !== "completed" && (
                                    <Badge className="px-1 md:px-1.5 pb-0 border-0 rounded-sm text-xs md:text-sm bg-blue-500/10 text-blue-500">
                                        {(file.progress || 0).toFixed(2)}%
                                    </Badge>
                                )}
                                &nbsp;
                                <StatusBadge status={file.status} hide={"completed"} />
                            </div>
                        </div>

                        {/* Row 2: Everything else */}
                        <div className="flex flex-wrap items-center gap-1 md:gap-2 text-xs text-muted-foreground">
                            {getSizeDisplay}
                            {getDesktopSecondRow}
                            <span className="flex-1" />
                            {getTimeDisplay}
                        </div>
                    </div>
                </div>
            </div>
        </FileItemContextMenu>
    );
}
