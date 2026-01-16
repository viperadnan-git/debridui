"use client";

import React, { useRef, useEffect, useState, memo } from "react";

interface LoadMoreSectionProps {
    hasMore: boolean;
    dataLength: number;
    onLoadMore: (offset: number) => void;
}

export const LoadMoreSection = memo(function LoadMoreSection({
    hasMore,
    dataLength,
    onLoadMore,
}: LoadMoreSectionProps) {
    const loadMoreTriggerRef = useRef<HTMLDivElement>(null);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    // Reset loading state when data changes
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsLoadingMore(false);
    }, [dataLength]);

    // Intersection observer for infinite scroll
    useEffect(() => {
        if (!hasMore || !loadMoreTriggerRef.current) return;

        const currentRef = loadMoreTriggerRef.current;
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && !isLoadingMore) {
                    setIsLoadingMore(true);
                    onLoadMore(dataLength);
                }
            },
            { rootMargin: "100px" }
        );

        observer.observe(currentRef);
        return () => currentRef && observer.unobserve(currentRef);
    }, [hasMore, isLoadingMore, onLoadMore, dataLength]);

    if (!hasMore) return null;

    return <span ref={loadMoreTriggerRef} />;
});
