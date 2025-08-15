"use client";

import { useAuthContext } from "@/app/(private)/layout";
import { useQuery } from "@tanstack/react-query";
import { DataTable } from "./data-table";
import { useState, useEffect } from "react";
import { DebridFile } from "@/lib/clients/types";

const PAGE_SIZE = 50;

export default function FileExplorer() {
    const { client, currentUser } = useAuthContext();
    const [allFiles, setAllFiles] = useState<DebridFile[]>([]);
    const [currentOffset, setCurrentOffset] = useState(0);
    const [hasMore, setHasMore] = useState(true);

    const { data, isLoading } = useQuery({
        queryKey: ["listFiles", currentUser.id, currentOffset],
        queryFn: () =>
            client.listFiles({ offset: currentOffset, limit: PAGE_SIZE }),
        refetchInterval: currentOffset === 0 ? 3000 : false, // Only auto-refresh first page
        staleTime: 0,
    });

    // Merge new data with existing files
    useEffect(() => {
        if (data) {
            if (currentOffset === 0) {
                // Reset on first page
                setAllFiles(data.files || []);
            } else {
                // Append new files
                setAllFiles((prev) => {
                    const existingIds = new Set(prev.map((f) => f.id));
                    const newFiles = (data.files || []).filter(
                        (f) => !existingIds.has(f.id)
                    );
                    return [...prev, ...newFiles];
                });
            }
            // Update hasMore based on the response
            setHasMore(data.hasMore ?? false);
        }
    }, [data, currentOffset]);

    const handleLoadMore = (offset: number) => {
        setCurrentOffset(offset);
    };

    if (isLoading && allFiles.length === 0) return <div>Loading...</div>;

    return (
        <div className="flex flex-col gap-4">
            <h1 className="text-2xl font-bold">File Explorer</h1>
            <DataTable
                data={allFiles}
                hasMore={hasMore}
                onLoadMore={handleLoadMore}
            />
        </div>
    );
}
