"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface FileListProps {
    children: React.ReactNode;
    className?: string;
}

export function FileList({ children, className }: FileListProps) {
    return (
        <div
            className={cn(
                "rounded-md md:border md:border-border",
                "overflow-hidden",
                "mx-0.5 sm:mx-0",
                className
            )}
        >
            {children}
        </div>
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

export function FileListEmpty({
    message = "No results.",
    className,
}: FileListEmptyProps) {
    return (
        <div
            className={cn(
                "flex items-center justify-center py-8 sm:py-12 md:py-16 text-sm text-muted-foreground",
                className
            )}
        >
            {message}
        </div>
    );
}
