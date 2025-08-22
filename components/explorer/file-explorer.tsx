"use client";

import React, { useState, useMemo, useCallback, Fragment } from "react";
import { SortControls } from "./sort-controls";
import { FileList, FileListBody, FileListEmpty, FileListLoading } from "./file-list";
import { FileListHeader } from "./file-list-header";
import { FileListRow } from "./file-list-row";
import { FileActionsDrawer } from "./file-actions-drawer";
import { useSelectionStore } from "@/lib/stores/selection";
import { AddContent } from "./add-content";
import { useFileExplorer } from "@/hooks/use-file-explorer";
import { SearchSection } from "./search-section";
import { LoadMoreSection } from "./load-more-section";
import { useSearchParams } from "next/navigation";
import { DebridFile } from "@/lib/types";

export function FileExplorer() {
    const { files, isLoading, hasMore, loadMore } = useFileExplorer();
    const searchParams = useSearchParams();
    const queryParam = searchParams.get("q") || "";

    const [searchResults, setSearchResults] = useState<DebridFile[] | null>(null);
    const [isSearching, setIsSearching] = useState(false);

    const selectedFileIds = useSelectionStore((state) => state.selectedFileIds);
    const selectAll = useSelectionStore((state) => state.selectAll);
    const clearAll = useSelectionStore((state) => state.clearAll);

    // Handle search results from SearchSection
    const handleSearchResults = useCallback((results: DebridFile[] | null, searching: boolean) => {
        setSearchResults(results);
        setIsSearching(searching);
    }, []);

    // Determine active data based on search state
    const activeData = useMemo((): DebridFile[] => {
        if (!queryParam) return files;
        return searchResults ?? [];
    }, [queryParam, searchResults, files]);

    // Selection handling
    const handleSelectAll = useCallback(
        (checked: boolean | "indeterminate") => {
            if (checked) {
                selectAll(activeData.map((file) => file.id));
            } else {
                clearAll();
            }
        },
        [activeData, selectAll, clearAll]
    );

    const headerCheckboxState = useMemo(() => {
        if (activeData.length === 0) return false;
        const allFilesSelected = activeData.every((file) => selectedFileIds.has(file.id));
        const someFilesSelected = activeData.some((file) => selectedFileIds.has(file.id));
        if (allFilesSelected) return true;
        if (someFilesSelected) return "indeterminate";
        return false;
    }, [activeData, selectedFileIds]);

    return (
        <>
            <div className="md:mx-auto md:w-full md:max-w-4xl">
                <div className="flex flex-col gap-4">
                    <h1 className="text-2xl font-bold">File Explorer</h1>
                    <AddContent />

                    {/* Search and Sort Controls */}
                    <div className="flex flex-col items-end md:flex-row md:items-center gap-2 sm:gap-4 mb-2 sm:mb-4">
                        <SearchSection onSearchResults={handleSearchResults} />
                        <SortControls />
                    </div>

                    <FileList className="max-sm:-mx-4">
                        <FileListHeader isAllSelected={headerCheckboxState} onSelectAll={handleSelectAll} />
                        <FileListBody>
                            {activeData.length > 0 && !isSearching && (
                                <Fragment>
                                    {activeData.map((file) => (
                                        <FileListRow key={file.id} file={file} />
                                    ))}
                                    {!queryParam && (
                                        <LoadMoreSection
                                            hasMore={hasMore}
                                            dataLength={activeData.length}
                                            onLoadMore={loadMore}
                                        />
                                    )}
                                </Fragment>
                            )}
                            {isLoading || isSearching ? (
                                <FileListLoading />
                            ) : (
                                activeData.length === 0 && <FileListEmpty />
                            )}
                        </FileListBody>
                    </FileList>
                    <FileActionsDrawer files={activeData} />
                </div>
            </div>
        </>
    );
}
