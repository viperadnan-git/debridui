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
                variant="outline"
                size="icon"
                className="scroll-carousel-btn scroll-carousel-btn-left max-md:hidden! absolute -left-4 top-1/2 -translate-y-1/2 z-10 size-8 rounded-sm bg-card/90 backdrop-blur-sm border-border/50 opacity-0 group-hover/scroll:opacity-100 transition-all duration-300 hover:bg-card hover:border-primary/30 hover:text-primary"
                onClick={() => scroll("left")}>
                <ChevronLeft className="size-4" />
            </Button>
            <Button
                variant="outline"
                size="icon"
                className="scroll-carousel-btn scroll-carousel-btn-right max-md:hidden! absolute -right-4 top-1/2 -translate-y-1/2 z-10 size-8 rounded-sm bg-card/90 backdrop-blur-sm border-border/50 opacity-0 group-hover/scroll:opacity-100 transition-all duration-300 hover:bg-card hover:border-primary/30 hover:text-primary"
                onClick={() => scroll("right")}>
                <ChevronRight className="size-4" />
            </Button>
            <ScrollArea ref={scrollContainerRef} className={cn(className)} {...props}>
                {children}
                <ScrollBar orientation="horizontal" className="hidden" />
            </ScrollArea>
        </div>
    );
}
