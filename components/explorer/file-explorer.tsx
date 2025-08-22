"use client";

import React, { useState, useMemo, useRef, useEffect, Fragment, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuthContext } from "@/lib/contexts/auth";
import { SearchBar } from "./search-bar";
import { SortControls } from "./sort-controls";
import { FileList, FileListBody, FileListEmpty, FileListLoading } from "./file-list";
import { FileListHeader } from "./file-list-header";
import { FileListRow } from "./file-list-row";
import { FileActionsDrawer } from "./file-actions-drawer";
import { useSelectionStore } from "@/lib/stores/selection";
import { AddContent } from "./add-content";
import { useFileExplorer } from "@/hooks/use-file-explorer";
import { useSearchParams, useRouter } from "next/navigation";

export function FileExplorer() {
    const { files, isLoading, hasMore, loadMore } = useFileExplorer();

    const searchParams = useSearchParams();
    const router = useRouter();
    const queryParam = searchParams.get("q") || "";
    const [searchQuery, setSearchQuery] = useState<string>(queryParam);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const loadMoreTriggerRef = useRef<HTMLDivElement>(null);
    const { client, currentUser } = useAuthContext();

    const selectedFileIds = useSelectionStore((state) => state.selectedFileIds);
    const selectAll = useSelectionStore((state) => state.selectAll);
    const clearAll = useSelectionStore((state) => state.clearAll);

    // Update URL when search query changes
    useEffect(() => {
        // Skip if the search query matches the URL param
        if (searchQuery === queryParam) return;

        const timer = setTimeout(() => {
            const params = new URLSearchParams(searchParams.toString());
            if (searchQuery) {
                params.set("q", searchQuery);
            } else {
                params.delete("q");
            }
            router.replace(`?${params.toString()}`, { scroll: false });
        }, 750);
        return () => clearTimeout(timer);
    }, [searchQuery, queryParam, searchParams, router]);

    // Update local state when URL param changes (only on initial load or external changes)
    useEffect(() => {
        setSearchQuery(queryParam);
    }, [queryParam]);

    // Search files query
    const { data: searchResults, isLoading: isSearching } = useQuery({
        queryKey: [currentUser.id, "findTorrents", queryParam],
        queryFn: () => (client.findTorrents ? client.findTorrents(queryParam) : Promise.resolve([])),
        enabled: !!queryParam && !!client.findTorrents,
        staleTime: 5_000,
    });

    const activeData = useMemo(() => {
        if (queryParam) {
            if (searchResults) {
                return searchResults;
            }
            return [];
        }
        return files;
    }, [queryParam, searchResults, files]);

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

    useEffect(() => {
        setIsLoadingMore(false);
    }, [files]);

    useEffect(() => {
        if (!hasMore || queryParam || !loadMoreTriggerRef.current) return;

        const currentRef = loadMoreTriggerRef.current;
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && !isLoadingMore) {
                    setIsLoadingMore(true);
                    loadMore?.(activeData.length);
                }
            },
            { rootMargin: "100px" }
        );

        observer.observe(currentRef);
        return () => {
            if (currentRef) observer.unobserve(currentRef);
            observer.disconnect();
        };
    }, [hasMore, isLoadingMore, loadMore, activeData.length, queryParam]);

    return (
        <>
            <div className="md:mx-auto md:w-full md:max-w-4xl">
                <div className="flex flex-col gap-4">
                    <h1 className="text-2xl font-bold">File Explorer</h1>
                    <AddContent />

                    {/* Search and Sort Controls */}
                    <div className="flex flex-col items-end md:flex-row md:items-center gap-2 sm:gap-4 mb-2 sm:mb-4">
                        <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search files..." />
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
                                    <span ref={loadMoreTriggerRef} />
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
