"use client";

import React, { useState, useMemo, useCallback, memo } from "react";
import { FolderOpen } from "lucide-react";
import { SortControls } from "./sort-controls";
import { FileList, FileListBody, FileListEmpty, FileListLoading } from "./file-list";
import { FileListHeader } from "./file-list-header";
import { FileListRow } from "./file-list-row";
import { FileActionsDrawer } from "./file-actions-drawer";
import { useSelectionStore } from "@/lib/stores/selection";
import { AddContent } from "./add-content";
import { useFileExplorer } from "@/hooks/use-file-explorer";
import { SearchSection } from "./search-section";
import { ListPagination } from "@/components/common/pagination";
import { useSearchParams } from "next/navigation";
import { DebridFile } from "@/lib/types";
import { PAGE_SIZE } from "@/lib/constants";

export const FileExplorer = memo(function FileExplorer() {
    const { files, isLoading, currentPage, totalPages, setPage } = useFileExplorer();
    const searchParams = useSearchParams();
    const queryParam = searchParams.get("q") || "";
    const isIdSearch = queryParam.trim().startsWith("id:");

    const [searchResults, setSearchResults] = useState<DebridFile[] | null>(null);
    const [isSearching, setIsSearching] = useState(false);
    const [searchPage, setSearchPage] = useState(1);

    const selectedFileIds = useSelectionStore((state) => state.selectedFileIds);
    const selectAll = useSelectionStore((state) => state.selectAll);
    const clearAll = useSelectionStore((state) => state.clearAll);

    // Handle search results from SearchSection
    const handleSearchResults = useCallback((results: DebridFile[] | null, searching: boolean) => {
        setSearchResults(results);
        setIsSearching(searching);
        setSearchPage(1); // Reset to first page on new search
    }, []);

    // Determine active data based on search state with pagination
    const activeData = useMemo((): DebridFile[] => {
        if (!queryParam) return files;
        if (!searchResults) return [];

        // Apply pagination to search results
        const startIndex = (searchPage - 1) * PAGE_SIZE;
        const endIndex = startIndex + PAGE_SIZE;
        return searchResults.slice(startIndex, endIndex);
    }, [queryParam, searchResults, files, searchPage]);

    // Calculate total pages for search results
    const searchTotalPages = useMemo(() => {
        if (!searchResults) return 0;
        return Math.ceil(searchResults.length / PAGE_SIZE);
    }, [searchResults]);

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

    // Wrapped page change handlers that scroll to top
    const handlePageChange = useCallback(
        (page: number) => {
            // Don't do anything if clicking the same page
            if (page === currentPage) return;

            // Scroll to top first for immediate feedback
            window.scrollTo(0, 0);
            setPage(page);
        },
        [currentPage, setPage]
    );

    const handleSearchPageChange = useCallback(
        (page: number) => {
            // Don't do anything if clicking the same page
            if (page === searchPage) return;

            // Scroll to top first for immediate feedback
            window.scrollTo(0, 0);
            setSearchPage(page);
        },
        [searchPage]
    );

    return (
        <>
            <div className="md:mx-auto md:w-full md:max-w-4xl pb-24">
                <div className="flex flex-col gap-4">
                    <h1 className="text-2xl sm:text-3xl font-light flex items-center gap-3">
                        <FolderOpen className="size-6 text-primary" strokeWidth={1.5} />
                        File Explorer
                    </h1>
                    <AddContent />

                    {/* Search and Sort Controls */}
                    <div className="flex flex-col items-end md:flex-row md:items-center gap-2 sm:gap-4 mb-2 sm:mb-4">
                        <SearchSection onSearchResults={handleSearchResults} />
                        <SortControls />
                    </div>

                    <FileList className="max-sm:-mx-4">
                        <FileListHeader
                            isAllSelected={headerCheckboxState}
                            onSelectAll={handleSelectAll}
                            selectedCount={selectedFileIds.size}
                        />
                        <FileListBody>
                            {activeData.length > 0 && !isSearching && (
                                <>
                                    {activeData.map((file) => (
                                        <FileListRow key={file.id} file={file} autoExpand={isIdSearch} />
                                    ))}
                                </>
                            )}
                            {isLoading || isSearching ? (
                                <FileListLoading />
                            ) : (
                                activeData.length === 0 && <FileListEmpty />
                            )}
                        </FileListBody>
                    </FileList>

                    {/* Pagination */}
                    {!isSearching && (
                        <>
                            {queryParam && searchTotalPages > 1 && (
                                <ListPagination
                                    currentPage={searchPage}
                                    totalPages={searchTotalPages}
                                    onPageChange={handleSearchPageChange}
                                    disabled={isLoading}
                                />
                            )}
                            {!queryParam && totalPages > 1 && (
                                <ListPagination
                                    currentPage={currentPage}
                                    totalPages={totalPages}
                                    onPageChange={handlePageChange}
                                    disabled={isLoading}
                                />
                            )}
                        </>
                    )}

                    <FileActionsDrawer files={activeData} />
                </div>
            </div>
        </>
    );
});
