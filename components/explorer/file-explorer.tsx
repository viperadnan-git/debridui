"use client";

import { FolderOpen } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { memo, useCallback, useMemo, useState } from "react";
import { ListPagination } from "@/components/common/pagination";
import { PageHeader } from "@/components/page-header";
import { useFileExplorer } from "@/hooks/use-file-explorer";
import { PAGE_SIZE } from "@/lib/constants";
import { useSelectionStore } from "@/lib/stores/selection";
import type { DebridFile } from "@/lib/types";
import { AddContent } from "./add-content";
import { FileActionsDrawer } from "./file-actions-drawer";
import { FileList, FileListBody, FileListEmpty, FileListLoading } from "./file-list";
import { FileListHeader } from "./file-list-header";
import { FileListRow } from "./file-list-row";
import { QuickSettings } from "./quick-settings";
import { SearchSection } from "./search-section";
import { SortControls } from "./sort-controls";

export const FileExplorer = memo(function FileExplorer() {
    const { files, isLoading, isRefetching, refetch, currentPage, totalPages, setPage } = useFileExplorer();
    const searchParams = useSearchParams();
    const queryParam = searchParams.get("q") || "";
    const isIdSearch = queryParam.trim().startsWith("id:");

    const [searchResults, setSearchResults] = useState<DebridFile[] | null>(null);
    const [isSearching, setIsSearching] = useState(false);
    const [searchPage, setSearchPage] = useState(1);

    const selectedFileIds = useSelectionStore((state) => state.selectedFileIds);
    const selectAll = useSelectionStore((state) => state.selectAll);
    const clearAll = useSelectionStore((state) => state.clearAll);

    const handleSearchResults = useCallback((results: DebridFile[] | null, searching: boolean) => {
        setSearchResults(results);
        setIsSearching(searching);
        setSearchPage(1); // Reset to first page on new search
    }, []);

    const activeData = useMemo((): DebridFile[] => {
        if (!queryParam) return files;
        if (!searchResults) return [];

        const startIndex = (searchPage - 1) * PAGE_SIZE;
        const endIndex = startIndex + PAGE_SIZE;
        return searchResults.slice(startIndex, endIndex);
    }, [queryParam, searchResults, files, searchPage]);

    const searchTotalPages = useMemo(() => {
        if (!searchResults) return 0;
        return Math.ceil(searchResults.length / PAGE_SIZE);
    }, [searchResults]);

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

    const selectedCount = useMemo(
        () => activeData.reduce((n, file) => n + (selectedFileIds.has(file.id) ? 1 : 0), 0),
        [activeData, selectedFileIds]
    );

    const headerCheckboxState = useMemo(() => {
        if (activeData.length === 0 || selectedCount === 0) return false;
        return selectedCount === activeData.length ? true : "indeterminate";
    }, [activeData, selectedCount]);

    const handlePageChange = useCallback(
        (page: number) => {
            if (page === currentPage) return;
            window.scrollTo(0, 0);
            setPage(page);
        },
        [currentPage, setPage]
    );

    const handleSearchPageChange = useCallback(
        (page: number) => {
            if (page === searchPage) return;
            window.scrollTo(0, 0);
            setSearchPage(page);
        },
        [searchPage]
    );

    return (
        <div className="md:mx-auto md:w-full md:max-w-4xl pb-24">
            <div className="flex flex-col gap-4">
                <PageHeader icon={FolderOpen} title="File Explorer" primaryAction={<QuickSettings />} />
                <AddContent />

                <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-4">
                    <SearchSection onSearchResults={handleSearchResults} />
                    <SortControls />
                </div>

                <FileList className="max-sm:-mx-4">
                    <FileListHeader
                        isAllSelected={headerCheckboxState}
                        onSelectAll={handleSelectAll}
                        selectedCount={selectedCount}
                        currentPage={queryParam ? searchPage : currentPage}
                        onRefresh={() => refetch()}
                        isRefreshing={isRefetching}
                    />
                    <FileListBody>
                        {activeData.length > 0 &&
                            !isSearching &&
                            activeData.map((file) => <FileListRow key={file.id} file={file} autoExpand={isIdSearch} />)}
                        {isLoading || isSearching ? <FileListLoading /> : activeData.length === 0 && <FileListEmpty />}
                    </FileListBody>
                </FileList>

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
    );
});
