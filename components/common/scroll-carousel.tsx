"use client";

import { useEffect, useRef, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils/index";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

const SCROLL_AMOUNT = 300;

export function ScrollCarousel({ className, children, ...props }: React.ComponentProps<typeof ScrollArea>) {
    const containerRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const container = containerRef.current;
        const viewport = scrollContainerRef.current?.querySelector("[data-radix-scroll-area-viewport]");
        if (!container || !viewport) return;

        const checkScrollable = () => {
            const isScrollable = viewport.scrollWidth > viewport.clientWidth;
            container.dataset.scrollable = String(isScrollable);
        };

        checkScrollable();

        const resizeObserver = new ResizeObserver(checkScrollable);
        resizeObserver.observe(viewport);

        return () => resizeObserver.disconnect();
    }, []);

    const scroll = useCallback((direction: "left" | "right") => {
        const viewport = scrollContainerRef.current?.querySelector("[data-radix-scroll-area-viewport]");
        if (!viewport) return;

        viewport.scrollBy({
            left: direction === "left" ? -SCROLL_AMOUNT : SCROLL_AMOUNT,
            behavior: "smooth",
        });
    }, []);

    return (
        <div ref={containerRef} className="relative group/scroll">
            <Button
                variant="ghost"
                size="icon"
                className="scroll-carousel-btn scroll-carousel-btn-left max-md:hidden! absolute -left-4 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm shadow-md border border-border/50 opacity-0 group-hover/scroll:opacity-100 transition-opacity"
                onClick={() => scroll("left")}>
                <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
                variant="ghost"
                size="icon"
                className="scroll-carousel-btn scroll-carousel-btn-right max-md:hidden! absolute -right-4 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm shadow-md border border-border/50 opacity-0 group-hover/scroll:opacity-100 transition-opacity"
                onClick={() => scroll("right")}>
                <ChevronRight className="h-4 w-4" />
            </Button>
            <ScrollArea ref={scrollContainerRef} className={cn(className)} {...props}>
                {children}
                <ScrollBar orientation="horizontal" />
            </ScrollArea>
        </div>
    );
}
