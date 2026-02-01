"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { memo } from "react";

export const HeroCarouselSkeleton = memo(function HeroCarouselSkeleton() {
    return (
        <div className="-mx-4 -mt-6 lg:-mx-6 relative">
            {/* Desktop skeleton */}
            <div className="hidden md:block relative w-full aspect-[2/1] overflow-hidden">
                <Skeleton className="absolute inset-0 rounded-none" />

                {/* Gradient overlays for depth */}
                <div className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/30" />

                {/* Content skeleton */}
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full max-w-7xl mx-auto px-8 lg:px-12 xl:px-16">
                        <div className="max-w-2xl space-y-5">
                            {/* Type label */}
                            <div className="flex items-center gap-4">
                                <Skeleton className="h-4 w-12" />
                                <div className="h-px w-8 bg-border/50" />
                                <Skeleton className="h-4 w-16" />
                            </div>

                            {/* Title */}
                            <div className="space-y-2">
                                <Skeleton className="h-12 lg:h-14 xl:h-16 w-4/5" />
                                <Skeleton className="h-12 lg:h-14 xl:h-16 w-2/3" />
                            </div>

                            {/* Meta */}
                            <div className="flex items-center gap-3">
                                <Skeleton className="h-5 w-12" />
                                <Skeleton className="h-5 w-16" />
                                <Skeleton className="h-5 w-14" />
                            </div>

                            {/* Overview */}
                            <div className="space-y-2">
                                <Skeleton className="h-5 w-full max-w-xl" />
                                <Skeleton className="h-5 w-3/4 max-w-lg" />
                            </div>

                            {/* CTA buttons */}
                            <div className="flex items-center gap-3 pt-2">
                                <Skeleton className="h-11 w-36" />
                                <Skeleton className="h-11 w-32" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile skeleton */}
            <div className="md:hidden relative w-full aspect-[9/14] overflow-hidden">
                <Skeleton className="absolute inset-0 rounded-none" />

                {/* Gradient overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-transparent to-transparent" />

                {/* Top indicator */}
                <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-4 w-14" />
                </div>

                {/* Bottom content */}
                <div className="absolute inset-x-0 bottom-0 p-4 pb-14 space-y-3">
                    {/* Title */}
                    <div className="space-y-2">
                        <Skeleton className="h-7 w-4/5" />
                        <Skeleton className="h-7 w-2/3" />
                    </div>

                    {/* Meta */}
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-10" />
                        <Skeleton className="h-4 w-12" />
                        <Skeleton className="h-4 w-10" />
                    </div>

                    {/* Overview */}
                    <div className="space-y-1.5">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                    </div>

                    {/* CTA */}
                    <div className="flex items-center gap-2 pt-1">
                        <Skeleton className="h-10 flex-1" />
                        <Skeleton className="h-10 w-10" />
                    </div>
                </div>
            </div>

            {/* Progress indicator skeleton */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10">
                <div className="flex items-center gap-1.5 px-3 py-2 bg-background/60 backdrop-blur-sm rounded-full border border-border/30">
                    {Array.from({ length: 10 }, (_, i) => (
                        <div key={i} className={`h-1 rounded-full bg-foreground/20 ${i === 0 ? "w-6" : "w-1.5"}`} />
                    ))}
                </div>
            </div>
        </div>
    );
});
