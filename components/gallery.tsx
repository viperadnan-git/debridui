"use client";

import { useState, useRef } from "react";
import { cn } from "@/lib/utils";

interface GalleryItem {
    id: string;
    label: string;
    src: {
        default: string;
        mobile?: string;
    };
}

interface GalleryProps {
    items: GalleryItem[];
    className?: string;
}

export function Gallery({ items, className }: GalleryProps) {
    const [active, setActive] = useState(0);
    const touchStartX = useRef<number | null>(null);

    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX;
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        if (touchStartX.current === null) return;

        const touchEndX = e.changedTouches[0].clientX;
        const diff = touchStartX.current - touchEndX;
        const threshold = 50;

        if (Math.abs(diff) > threshold) {
            if (diff > 0 && active < items.length - 1) {
                setActive(active + 1);
            } else if (diff < 0 && active > 0) {
                setActive(active - 1);
            }
        }
        touchStartX.current = null;
    };

    return (
        <div className={cn("space-y-4 sm:space-y-6", className)}>
            {/* Tab Navigation - hidden on mobile, shown on sm+ */}
            <div className="hidden sm:flex items-center justify-center gap-2">
                {items.map((item, index) => (
                    <button
                        key={item.id}
                        onClick={() => setActive(index)}
                        className={cn(
                            "px-4 py-2 text-sm tracking-wider uppercase transition-all duration-300",
                            "border-b-2 -mb-px",
                            active === index
                                ? "text-foreground border-foreground"
                                : "text-muted-foreground border-transparent hover:text-foreground/70 hover:border-border"
                        )}>
                        {item.label}
                    </button>
                ))}
            </div>

            {/* Mobile: Previous / Current / Next labels */}
            <div className="sm:hidden flex items-center justify-center gap-4 overflow-hidden">
                <button
                    onClick={() => active > 0 && setActive(active - 1)}
                    disabled={active === 0}
                    className={cn(
                        "text-xs tracking-wider uppercase w-20 text-right truncate transition-all duration-300",
                        active > 0
                            ? "text-muted-foreground/50 hover:text-muted-foreground"
                            : "opacity-0 pointer-events-none"
                    )}>
                    {active > 0 ? items[active - 1].label : ""}
                </button>
                <span
                    key={active}
                    className="text-xs tracking-widest uppercase text-foreground font-medium min-w-20 text-center transition-all duration-300">
                    {items[active].label}
                </span>
                <button
                    onClick={() => active < items.length - 1 && setActive(active + 1)}
                    disabled={active === items.length - 1}
                    className={cn(
                        "text-xs tracking-wider uppercase w-20 text-left truncate transition-all duration-300",
                        active < items.length - 1
                            ? "text-muted-foreground/50 hover:text-muted-foreground"
                            : "opacity-0 pointer-events-none"
                    )}>
                    {active < items.length - 1 ? items[active + 1].label : ""}
                </button>
            </div>

            {/* Screenshot Display */}
            <div
                className="relative rounded-sm sm:rounded-lg border border-border/50 bg-muted/20 overflow-hidden touch-pan-y"
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}>
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 pointer-events-none z-10" />

                {/* Desktop: 16:9 landscape */}
                <div className="relative aspect-[16/9] hidden sm:block">
                    {items.map((item, index) => (
                        <img
                            key={item.id}
                            src={item.src.default}
                            alt={`DebridUI ${item.label}`}
                            width={1920}
                            height={1080}
                            className={cn(
                                "w-full h-full object-cover transition-opacity duration-500",
                                active === index ? "opacity-90" : "opacity-0 absolute inset-0"
                            )}
                        />
                    ))}
                </div>

                {/* Mobile: 9:16 portrait (falls back to default if no mobile) */}
                <div
                    className={cn("relative sm:hidden", items[active]?.src.mobile ? "aspect-[9/16]" : "aspect-[16/9]")}>
                    {items.map((item, index) => (
                        <img
                            key={item.id}
                            src={item.src.mobile || item.src.default}
                            alt={`DebridUI ${item.label}`}
                            width={item.src.mobile ? 1080 : 1920}
                            height={item.src.mobile ? 1920 : 1080}
                            className={cn(
                                "w-full h-full object-cover transition-opacity duration-500",
                                active === index ? "opacity-90" : "opacity-0 absolute inset-0"
                            )}
                        />
                    ))}
                </div>

                <div className="absolute inset-x-0 bottom-0 h-24 sm:h-32 bg-gradient-to-t from-background to-transparent pointer-events-none" />

                {/* Progress Indicators - touch-optimized on mobile */}
                <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 sm:gap-1.5 z-20">
                    {items.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => setActive(index)}
                            className={cn(
                                "rounded-full transition-all duration-300",
                                // Mobile: larger touch targets
                                "h-1.5 sm:h-1",
                                active === index
                                    ? "w-8 sm:w-6 bg-foreground/70"
                                    : "w-1.5 bg-foreground/20 hover:bg-foreground/40"
                            )}
                            aria-label={`View ${items[index].label}`}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
