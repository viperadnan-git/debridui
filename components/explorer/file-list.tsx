"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface FileListProps {
    children: React.ReactNode;
    className?: string;
}

export function FileList({ children, className }: FileListProps) {
    return (
        <div className={cn("md:rounded-sm md:border md:border-border/50 overflow-hidden", className)}>{children}</div>
    );
}

interface FileListBodyProps {
    children: React.ReactNode;
    className?: string;
}

export function FileListBody({ children, className }: FileListBodyProps) {
    return <div className={cn("relative", className)}>{children}</div>;
}

interface FileListEmptyProps {
    message?: string;
    className?: string;
}

export function FileListEmpty({ message = "No results.", className }: FileListEmptyProps) {
    return (
        <div
            className={cn(
                "flex items-center justify-center py-8 sm:py-12 md:py-16 text-sm text-muted-foreground bg-muted/20",
                className
            )}>
            {message}
        </div>
    );
}

function FileRowSkeleton() {
    return (
        <div className="flex items-center gap-1 sm:gap-2 md:gap-3 px-1 sm:px-2 md:px-4 py-1.5 sm:py-2 md:py-3 border-b border-border/50">
            <div className="shrink-0 px-1">
                <Skeleton className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0 pe-2">
                <div className="flex flex-col gap-2">
                    <div className="flex justify-between gap-2">
                        <Skeleton className="h-5 w-2/3" />
                        <Skeleton className="h-5 w-16" />
                    </div>
                    <div className="flex gap-2">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-16 ml-auto" />
                    </div>
                </div>
            </div>
        </div>
    );
}

export function FileListLoading() {
    return (
        <>
            {Array.from({ length: 8 }).map((_, i) => (
                <FileRowSkeleton key={i} />
            ))}
        </>
    );
}
