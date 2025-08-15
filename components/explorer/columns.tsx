"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DebridFile } from "@/lib/clients/types";
import { Checkbox } from "@/components/ui/checkbox";
import { formatSize, formatRelativeTime, formatSpeed, cn } from "@/lib/utils";
import { StatusBadge } from "../display";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export const columns: ColumnDef<DebridFile>[] = [
    {
        id: "select-col",
        header: ({ table }) => (
            <Checkbox
                checked={
                    table.getIsSomeRowsSelected() ? "indeterminate" : table.getIsAllRowsSelected()
                }
                onCheckedChange={(checked: boolean | "indeterminate") => {
                    if (checked === "indeterminate") {
                        table.toggleAllRowsSelected(false);
                    } else {
                        table.toggleAllRowsSelected(checked);
                    }
                }}
            />
        ),
        cell: ({ row }) => (
            <Checkbox
                checked={row.getIsSelected()}
                disabled={!row.getCanSelect()}
                onCheckedChange={row.getToggleSelectedHandler()}
                onClick={(e) => e.stopPropagation()}
            />
        ),
    },
    {
        accessorKey: "name",
        header: "File Details",
        cell: ({ row }) => {
            const file = row.original;

            const getSecondRowContent = () => {
                switch (file.status) {
                    case "completed":
                        return (
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <span>{formatRelativeTime(file.completedAt!)}</span>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>
                                            Completed {new Date(file.completedAt!).toLocaleString()}
                                        </p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        );

                    case "downloading":
                        return (
                            <>
                                <StatusBadge status={file.status} />
                                <span className="text-muted-foreground">•</span>
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <span>{formatSize(file.downloaded)}</span>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Downloaded</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                                <span className="text-muted-foreground">•</span>
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <span className="text-blue-600">
                                                {formatSpeed(file.downloadSpeed)}
                                            </span>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Download speed</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                                <span className="text-muted-foreground">•</span>
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <span>{formatRelativeTime(file.createdAt)}</span>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>
                                                Created {new Date(file.createdAt).toLocaleString()}
                                            </p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </>
                        );

                    case "uploading":
                        return (
                            <>
                                <StatusBadge status={file.status} />
                                <span className="text-muted-foreground">•</span>
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <span className="text-green-600">
                                                {formatSize(file.uploaded)}
                                            </span>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Uploaded</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                                <span className="text-muted-foreground">•</span>
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <span className="text-blue-600">
                                                {formatSpeed(file.uploadSpeed)}
                                            </span>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Upload speed</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                                <span className="text-muted-foreground">•</span>
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <span>{formatRelativeTime(file.createdAt)}</span>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>
                                                Created {new Date(file.createdAt).toLocaleString()}
                                            </p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </>
                        );

                    case "failed":
                        return (
                            <>
                                <StatusBadge status={file.status} />
                                <span className="text-muted-foreground">•</span>
                                <span className="truncate max-w-[120px] sm:max-w-[200px]">
                                    {file.error}
                                </span>
                            </>
                        );

                    default:
                        return (
                            <>
                                <StatusBadge status={file.status} />
                                <span className="text-muted-foreground">•</span>
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <span>{formatRelativeTime(file.createdAt)}</span>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>
                                                Created {new Date(file.createdAt).toLocaleString()}
                                            </p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </>
                        );
                }
            };

            return (
                <div>
                    <div className="flex flex-col gap-0.5 sm:gap-1">
                        <div className={cn("text-xs sm:text-sm font-medium truncate", file.status === "completed" && "hover:underline")}>{file.name}</div>
                        <div className="flex items-center gap-1 sm:gap-2 text-xs text-muted-foreground">
                            <span>{formatSize(file.size)}</span>
                            <span>•</span>
                            {getSecondRowContent()}
                        </div>
                    </div>
                </div>
            );
        },
    },
];
