"use client";

import { DataTable } from "./data-table";
import { AddContent } from "./add-content";
import { useFileExplorer } from "@/hooks/use-file-explorer";

export default function FileExplorer() {
    const { files, isLoading, hasMore, loadMore } = useFileExplorer();
    if (isLoading && files.length === 0) return <div>Loading...</div>;

    return (
        <div className="flex flex-col gap-4">
            <h1 className="text-2xl font-bold">File Explorer</h1>
            <AddContent />
            <DataTable
                data={files}
                hasMore={hasMore}
                onLoadMore={loadMore}
            />
        </div>
    );
}
