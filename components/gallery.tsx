"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface GalleryItem {
    id: string;
    label: string;
    src: string;
}

interface GalleryProps {
    items: GalleryItem[];
    className?: string;
}

export function Gallery({ items, className }: GalleryProps) {
    const [active, setActive] = useState(0);

    return (
        <div className={cn("space-y-6", className)}>
            {/* Tab Navigation */}
            <div className="flex items-center justify-center gap-1 sm:gap-2">
                {items.map((item, index) => (
                    <button
                        key={item.id}
                        onClick={() => setActive(index)}
                        className={cn(
                            "px-3 sm:px-4 py-2 text-xs sm:text-sm tracking-wide transition-all duration-300",
                            "border-b-2 -mb-px",
                            active === index
                                ? "text-foreground border-foreground"
                                : "text-muted-foreground border-transparent hover:text-foreground/70 hover:border-border"
                        )}>
                        {item.label}
                    </button>
                ))}
            </div>

            {/* Screenshot Display */}
            <div className="relative rounded-lg border border-border/50 bg-muted/20 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 pointer-events-none z-10" />

                <div className="relative">
                    {items.map((item, index) => (
                        <img
                            key={item.id}
                            src={item.src}
                            alt={`DebridUI ${item.label}`}
                            className={cn(
                                "w-full aspect-[16/9] object-cover transition-opacity duration-500",
                                active === index ? "opacity-90" : "opacity-0 absolute inset-0"
                            )}
                        />
                    ))}
                </div>

                <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background to-transparent pointer-events-none" />

                {/* Progress Indicators */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20">
                    {items.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => setActive(index)}
                            className={cn(
                                "h-1 rounded-full transition-all duration-300",
                                active === index
                                    ? "w-6 bg-foreground/70"
                                    : "w-1.5 bg-foreground/20 hover:bg-foreground/40"
                            )}
                            aria-label={`View screenshot ${index + 1}`}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
