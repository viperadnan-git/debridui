"use client";

import { DataTable } from "./data-table";
import { AddContent } from "./add-content";
import { useFileExplorer } from "@/hooks/use-file-explorer";
import { Loader2 } from "lucide-react";

export default function FileExplorer() {
    const { files, isLoading, hasMore, loadMore } = useFileExplorer();

    return (
        <div className="flex flex-col gap-4">
            <h1 className="text-2xl font-bold">File Explorer</h1>
            <AddContent />
            {isLoading && files.length === 0 ? (
                <div className="flex flex-col gap-4 items-center justify-center h-full">
                    <Loader2 className="size-4 animate-spin" />
                </div>
            ) : (
                <DataTable
                    data={files}
                    hasMore={hasMore}
                    onLoadMore={loadMore}
                />
            )}
        </div>
    );
}
