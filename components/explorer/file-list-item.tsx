"use client";

import { memo } from "react";
import { DebridFile } from "@/lib/types";
import { Checkbox } from "@/components/ui/checkbox";
import { formatSize, formatRelativeTime, formatSpeed, cn } from "@/lib/utils";
import { StatusBadge } from "../display";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
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

// Extracted sub-components for cleaner code and better readability
const SizeDisplay = memo(function SizeDisplay({
    status,
    size,
    downloaded,
    uploaded,
}: Pick<DebridFile, "status" | "size" | "downloaded" | "uploaded">) {
    const formattedSize = formatSize(size);

    if (status === "downloading" && downloaded !== undefined) {
        return (
            <>
                <span>Size: {formattedSize}</span>
                <span className="text-border">·</span>
                <span>DL: {formatSize(downloaded)}</span>
            </>
        );
    }

    if (status === "uploading" && uploaded !== undefined) {
        return (
            <>
                <span>Size: {formattedSize}</span>
                <span className="text-border">·</span>
                <span>UL: {formatSize(uploaded)}</span>
            </>
        );
    }

    return <span>Size: {formattedSize}</span>;
});

const TransferDetails = memo(function TransferDetails({
    status,
    peers,
    downloadSpeed,
    uploadSpeed,
    error,
}: Pick<DebridFile, "status" | "peers" | "downloadSpeed" | "uploadSpeed" | "error">) {
    const showPeers = status !== "completed" && !!peers;
    const showDownloadSpeed = status === "downloading" && !!downloadSpeed;
    const showUploadSpeed = status === "uploading" && !!uploadSpeed;

    if (!showPeers && !showDownloadSpeed && !showUploadSpeed && !error) {
        return null;
    }

    return (
        <>
            {showPeers && (
                <>
                    <span className="text-border">·</span>
                    <span>Peers: {peers}</span>
                </>
            )}
            {showDownloadSpeed && (
                <>
                    <span className="text-border">·</span>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <span className="text-blue-600 dark:text-blue-400">
                                Speed: {formatSpeed(downloadSpeed)}
                            </span>
                        </TooltipTrigger>
                        <TooltipContent>Download speed</TooltipContent>
                    </Tooltip>
                </>
            )}
            {showUploadSpeed && (
                <>
                    <span className="text-border">·</span>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <span className="text-green-600 dark:text-green-400">
                                Speed: {formatSpeed(uploadSpeed)}
                            </span>
                        </TooltipTrigger>
                        <TooltipContent>Upload speed</TooltipContent>
                    </Tooltip>
                </>
            )}
            {error && (
                <>
                    <span className="text-border">·</span>
                    <span className="truncate max-w-[200px] text-destructive">{error}</span>
                </>
            )}
        </>
    );
});

const TimeDisplay = memo(function TimeDisplay({
    status,
    completedAt,
    createdAt,
}: Pick<DebridFile, "status" | "completedAt" | "createdAt">) {
    const date = completedAt || createdAt;
    const label = status === "completed" ? "Completed" : "Added";

    return (
        <Tooltip delayDuration={2000}>
            <TooltipTrigger asChild>
                <span className="cursor-pointer">{formatRelativeTime(date)}</span>
            </TooltipTrigger>
            <TooltipContent>
                {label} {date.toLocaleString()}
            </TooltipContent>
        </Tooltip>
    );
});

export const FileListItem = memo(function FileListItem({
    file,
    isSelected,
    canExpand,
    onToggleSelect,
    onToggleExpand,
    className,
}: FileListItemProps) {
    const showProgress = !!file.progress && file.status !== "completed";

    return (
        <FileItemContextMenu file={file}>
            <div
                className={cn(
                    "flex items-center gap-1 sm:gap-2 md:gap-3 px-1 sm:px-2 md:px-4 py-1.5 sm:py-2 md:py-3 border-b border-border/50 transition-colors duration-300 bg-card max-md:select-none",
                    canExpand && "cursor-pointer hover:bg-muted/30",
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
                            <div className="flex items-center gap-2">
                                {showProgress && (
                                    <Badge className="px-1 md:px-1.5 pb-0 border-0 rounded-sm text-xs md:text-sm bg-blue-500/10 text-blue-500">
                                        {file.progress?.toFixed(2)}%
                                    </Badge>
                                )}
                                <StatusBadge status={file.status} hide="completed" />
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-1 md:gap-2 text-xs text-muted-foreground">
                            <SizeDisplay
                                status={file.status}
                                size={file.size}
                                downloaded={file.downloaded}
                                uploaded={file.uploaded}
                            />
                            <TransferDetails
                                status={file.status}
                                peers={file.peers}
                                downloadSpeed={file.downloadSpeed}
                                uploadSpeed={file.uploadSpeed}
                                error={file.error}
                            />
                            <span className="flex-1" />
                            <TimeDisplay
                                status={file.status}
                                completedAt={file.completedAt}
                                createdAt={file.createdAt}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </FileItemContextMenu>
    );
});
