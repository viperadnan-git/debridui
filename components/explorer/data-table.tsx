"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { DebridFile, DebridFileNode } from "@/lib/types";
import { useAuthContext } from "@/lib/contexts/auth";
import { SearchBar } from "./search-bar";
import { SortControls } from "./sort-controls";
import { FileList, FileListBody, FileListEmpty } from "./file-list";
import { FileListHeader } from "./file-list-header";
import { FileListItem } from "./file-list-item";
import { ExpandedRow } from "./expanded-row";
import { FileActionsDrawer } from "./file-actions-drawer";
import { useSelectionStore, useFileSelectionState } from "@/lib/stores/selection";

interface DataTableProps {
    data: DebridFile[];
    hasMore?: boolean;
    onLoadMore?: (offset: number) => void;
}

interface DataTableRowProps {
    file: DebridFile;
    isExpanded: boolean;
    onToggleExpand: () => void;
    onToggleSelect: () => void;
}

function DataTableRow({ file, isExpanded, onToggleExpand, onToggleSelect }: DataTableRowProps) {
    const isSelected = useFileSelectionState(file.id);

    return (
        <React.Fragment>
            <FileListItem
                file={file}
                isSelected={isSelected}
                canExpand={file.status === "completed"}
                onToggleSelect={onToggleSelect}
                onToggleExpand={onToggleExpand}
            />
            {isExpanded && (
                <div className="border-b border-border/40 bg-muted/10">
                    <ExpandedRow file={file} />
                </div>
            )}
        </React.Fragment>
    );
}

export function DataTable({ data, hasMore = false, onLoadMore }: DataTableProps) {
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());
    const loadMoreTriggerRef = useRef<HTMLDivElement>(null);
    const { client, currentUser } = useAuthContext();

    const selectedFileIds = useSelectionStore((state) => state.selectedFileIds);
    const toggleFileSelection = useSelectionStore((state) => state.toggleFileSelection);
    const selectAll = useSelectionStore((state) => state.selectAll);
    const clearAll = useSelectionStore((state) => state.clearAll);
    const queryClient = useQueryClient();

    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState<string>("");

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearchQuery(searchQuery), 1000);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Search files query
    const { data: searchResults } = useQuery({
        queryKey: [currentUser.id, "findTorrents", debouncedSearchQuery],
        queryFn: () => (client.findTorrents ? client.findTorrents(debouncedSearchQuery) : Promise.resolve([])),
        enabled: !!debouncedSearchQuery && !!client.findTorrents,
        staleTime: 5_000,
    });

    const activeData = useMemo(() => {
        if (debouncedSearchQuery && searchResults) {
            return searchResults;
        }
        return data;
    }, [debouncedSearchQuery, searchResults, data]);

    const handleSelectAll = (checked: boolean | "indeterminate") => {
        if (checked) {
            selectAll(activeData.map((file) => file.id));
        } else {
            clearAll();
        }
    };

    const collectNodeIds = (nodes: DebridFileNode[], result: string[] = []): string[] => {
        for (const node of nodes) {
            if (node.type === "file" && node.id) {
                result.push(node.id);
            }
            if (node.children) collectNodeIds(node.children, result);
        }
        return result;
    };

    const handleSelectFile = (fileId: string) => {
        const fileNodes = queryClient.getQueryData<DebridFileNode[]>([currentUser.id, "getTorrentFiles", fileId]);
        toggleFileSelection(fileId, fileNodes ? collectNodeIds(fileNodes) : []);
    };

    const handleToggleExpand = (fileId: string) => {
        setExpandedFiles((prev) => {
            const newExpanded = new Set(prev);
            if (newExpanded.has(fileId)) {
                newExpanded.delete(fileId);
            } else {
                newExpanded.add(fileId);
            }
            return newExpanded;
        });
    };

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
    }, [data]);

    useEffect(() => {
        if (!hasMore || debouncedSearchQuery || !loadMoreTriggerRef.current) return;

        const currentRef = loadMoreTriggerRef.current;
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && !isLoadingMore) {
                    setIsLoadingMore(true);
                    onLoadMore?.(activeData.length);
                }
            },
            { rootMargin: "100px" }
        );

        observer.observe(currentRef);
        return () => {
            if (currentRef) observer.unobserve(currentRef);
            observer.disconnect();
        };
    }, [hasMore, isLoadingMore, onLoadMore, activeData.length, debouncedSearchQuery]);

    return (
        <>
            {/* Search and Sort Controls */}
            <div className="flex flex-col items-end md:flex-row md:items-center gap-2 sm:gap-4 mb-2 sm:mb-4">
                <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search files..." />
                <SortControls />
            </div>

            <FileList className="max-sm:-mx-4">
                <FileListHeader isAllSelected={headerCheckboxState} onSelectAll={handleSelectAll} />
                <FileListBody>
                    {activeData.length > 0 ? (
                        <>
                            {activeData.map((file) => (
                                <DataTableRow
                                    key={file.id}
                                    file={file}
                                    isExpanded={expandedFiles.has(file.id)}
                                    onToggleExpand={() => handleToggleExpand(file.id)}
                                    onToggleSelect={() => handleSelectFile(file.id)}
                                />
                            ))}
                        </>
                    ) : (
                        <FileListEmpty />
                    )}
                </FileListBody>
            </FileList>

            {/* Infinite scroll trigger */}
            {hasMore && !debouncedSearchQuery && (
                <div ref={loadMoreTriggerRef} className="flex items-center justify-center py-2 sm:py-4">
                    {isLoadingMore && (
                        <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                            <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                            Loading more...
                        </div>
                    )}
                </div>
            )}

            <FileActionsDrawer files={activeData} />
        </>
    );
}
