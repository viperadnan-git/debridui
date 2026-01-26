"use client";

import { useCallback, memo, ReactNode } from "react";
import { CommandItem } from "@/components/ui/command";
import { cn } from "@/lib/utils";

interface SearchItemWrapperProps<T> {
    data?: T;
    variant?: "modal" | "page";
    onSelect?: (data: T) => void;
    children: ReactNode;
    commandValue?: string;
    commandKeywords?: string[];
    className?: string;
}

function SearchItemWrapperComponent<T>({
    data,
    variant = "modal",
    onSelect,
    children,
    commandValue,
    commandKeywords,
    className,
}: SearchItemWrapperProps<T>) {
    const handleSelect = useCallback(() => {
        if (onSelect && data) {
            onSelect(data);
        }
    }, [data, onSelect]);

    if (variant === "modal") {
        return (
            <CommandItem
                value={commandValue}
                keywords={commandKeywords}
                onSelect={onSelect ? handleSelect : undefined}
                className={cn(
                    "flex items-center gap-2 sm:gap-3 px-1 sm:px-3 py-2 sm:py-3",
                    onSelect && "cursor-pointer",
                    className
                )}>
                {children}
            </CommandItem>
        );
    }

    return (
        <div
            onClick={onSelect ? handleSelect : undefined}
            className={cn(
                "flex items-center gap-2 sm:gap-3 px-3 py-3 rounded-md hover:bg-muted transition-colors",
                onSelect && "cursor-pointer",
                className
            )}>
            {children}
        </div>
    );
}

export const SearchItemWrapper = memo(SearchItemWrapperComponent) as typeof SearchItemWrapperComponent;
