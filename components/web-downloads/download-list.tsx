"use client";

import { useState, useMemo, useCallback } from "react";
import { useWebDownloads } from "./web-downloads-provider";
import { DownloadItem, DownloadItemSkeleton } from "./download-item";
import { DownloadsBulkActions } from "./downloads-bulk-actions";
import { ListPagination } from "@/components/common/pagination";
import { Link2Off } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

export function DownloadList() {
    const { downloads, isLoading, deleteDownload, getDownloadLink, currentPage, totalPages, setPage } =
        useWebDownloads();

    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const toggle = useCallback((id: string) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    }, []);

    const clearAll = useCallback(() => setSelectedIds(new Set()), []);

    // Selection state for current page
    const pageIds = useMemo(() => downloads.map((d) => d.id), [downloads]);

    const headerCheckboxState = useMemo(() => {
        if (pageIds.length === 0) return false;
        const selectedOnPage = pageIds.filter((id) => selectedIds.has(id));
        if (selectedOnPage.length === pageIds.length) return true;
        if (selectedOnPage.length > 0) return "indeterminate";
        return false;
    }, [pageIds, selectedIds]);

    const handleSelectAll = useCallback(
        (checked: boolean | "indeterminate") => {
            if (checked) {
                setSelectedIds((prev) => {
                    const next = new Set(prev);
                    pageIds.forEach((id) => next.add(id));
                    return next;
                });
            } else {
                setSelectedIds((prev) => {
                    const next = new Set(prev);
                    pageIds.forEach((id) => next.delete(id));
                    return next;
                });
            }
        },
        [pageIds]
    );

    // Get selected downloads for bulk actions
    const selectedDownloads = useMemo(() => downloads.filter((d) => selectedIds.has(d.id)), [downloads, selectedIds]);

    if (isLoading) {
        return (
            <div className="-mx-4 md:mx-0 rounded-none md:rounded-sm border-y md:border border-border/50 bg-card overflow-hidden">
                {[1, 2, 3].map((i) => (
                    <DownloadItemSkeleton key={i} />
                ))}
            </div>
        );
    }

    if (downloads.length === 0 && currentPage === 1) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <Link2Off className="size-10 text-muted-foreground/50 mb-3" />
                <p className="text-sm font-light text-foreground">No downloads yet</p>
                <p className="text-xs text-muted-foreground mt-1">
                    Add links above to unlock and download files from supported hosters
                </p>
            </div>
        );
    }

    return (
        <>
            <div className="-mx-4 md:mx-0 rounded-none md:rounded-sm border-y md:border border-border/50 bg-card overflow-hidden">
                {/* Header with select all */}
                <div className="flex items-center gap-3 px-3 py-2.5 border-b border-border/50 bg-muted/30">
                    <Checkbox
                        checked={headerCheckboxState}
                        onCheckedChange={handleSelectAll}
                        aria-label="Select all downloads on this page"
                    />
                    <span className="text-xs tracking-widest uppercase text-muted-foreground">
                        {selectedIds.size > 0
                            ? `${selectedIds.size} selected`
                            : `${downloads.length} download${downloads.length !== 1 ? "s" : ""}`}
                    </span>
                    {totalPages > 1 && (
                        <span className="text-xs text-muted-foreground ml-auto">
                            Page {currentPage} of {totalPages}
                        </span>
                    )}
                </div>

                {/* Download items */}
                {downloads.map((download) => (
                    <DownloadItem
                        key={download.id}
                        download={download}
                        onDelete={deleteDownload}
                        onGetLink={getDownloadLink}
                        isSelected={selectedIds.has(download.id)}
                        onToggleSelect={toggle}
                    />
                ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <ListPagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setPage}
                    className="mt-4"
                />
            )}

            {/* Bulk actions drawer */}
            <DownloadsBulkActions selectedDownloads={selectedDownloads} onClearSelection={clearAll} />
        </>
    );
}
