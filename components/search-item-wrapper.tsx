"use client";

import { memo, type ReactNode, useCallback } from "react";
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

    const rowClasses =
        "group/row flex items-center gap-3 sm:gap-4 px-4 lg:px-5 py-3.5 lg:py-4 rounded-none hover:bg-muted/30 focus-visible:bg-muted/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-primary/50 data-[selected=true]:bg-muted/50 data-[selected=true]:ring-1 data-[selected=true]:ring-inset data-[selected=true]:ring-primary/50 transition-colors";

    if (variant === "modal") {
        return (
            <CommandItem
                value={commandValue}
                keywords={commandKeywords}
                onSelect={onSelect ? handleSelect : undefined}
                className={cn(rowClasses, onSelect && "cursor-pointer", className)}>
                {children}
            </CommandItem>
        );
    }

    const interactive = !!onSelect;

    return (
        // biome-ignore lint/a11y/noStaticElementInteractions: row may be informational (no onSelect); when interactive it gets role=button, tabIndex, and key handlers
        <div
            onClick={interactive ? handleSelect : undefined}
            onKeyDown={
                interactive
                    ? (e) => {
                          if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              handleSelect();
                          }
                      }
                    : undefined
            }
            role={interactive ? "button" : undefined}
            tabIndex={interactive ? 0 : undefined}
            className={cn(rowClasses, interactive && "cursor-pointer", className)}>
            {children}
        </div>
    );
}

export const SearchItemWrapper = memo(SearchItemWrapperComponent) as typeof SearchItemWrapperComponent;
