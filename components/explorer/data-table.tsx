"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { DebridFile } from "@/lib/clients/types";
import { useAuthContext } from "@/app/(private)/layout";
import { SearchBar } from "./search-bar";
import { SortControls, SortOption } from "./sort-controls";
import { FileList, FileListBody, FileListEmpty } from "./file-list";
import { FileListHeader } from "./file-list-header";
import { FileListItem } from "./file-list-item";
import { ExpandedRow } from "./expanded-row";
import { SettingsSwitches } from "./settings-switches";

interface DataTableProps {
    data: DebridFile[];
    hasMore?: boolean;
    onLoadMore?: (offset: number) => void;
}

type SortOptionWithAccessor = SortOption & {
    accessor: (item: DebridFile) => string | number | Date;
};

const sortOptions: SortOptionWithAccessor[] = [
    {
        value: "date",
        label: "Date Added",
        accessor: (file: DebridFile) => file.createdAt,
    },
    {
        value: "name",
        label: "Name",
        accessor: (file: DebridFile) => file.name.toLowerCase(),
    },
    {
        value: "size",
        label: "Size",
        accessor: (file: DebridFile) => file.size,
    },
    {
        value: "status",
        label: "Status",
        accessor: (file: DebridFile) => file.status,
    },
    {
        value: "progress",
        label: "Progress",
        accessor: (file: DebridFile) => file.progress || 0,
    },
    {
        value: "downloaded",
        label: "Downloaded",
        accessor: (file: DebridFile) => file.downloaded || 0,
    },
    {
        value: "downloadSpeed",
        label: "Download Speed",
        accessor: (file: DebridFile) => file.downloadSpeed || 0,
    },
];

export function DataTable({
    data,
    hasMore = false,
    onLoadMore,
}: DataTableProps) {
    const [sortBy, setSortBy] = useState<string>("date");
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
    const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());
    const previousDataLength = useRef(data.length);
    const loadMoreTriggerRef = useRef<HTMLDivElement>(null);
    const { client } = useAuthContext();

    // Search query with debounce
    const [debouncedSearchQuery, setDebouncedSearchQuery] =
        useState<string>("");

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchQuery(searchQuery);
        }, 1000);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Search files query
    const { data: searchResults } = useQuery({
        queryKey: ["searchFiles", debouncedSearchQuery],
        queryFn: () =>
            client.searchFiles
                ? client.searchFiles(debouncedSearchQuery)
                : Promise.resolve([]),
        enabled: !!debouncedSearchQuery && !!client.searchFiles,
        staleTime: 5_000,
    });

    // Use search results if searching, otherwise use provided data
    const activeData =
        debouncedSearchQuery && searchResults ? searchResults : data;

    // Sort data
    const sortedData = useMemo(() => {
        const sortOption = sortOptions.find((opt) => opt.value === sortBy);
        if (!sortOption) return activeData;

        // For search results, just sort normally without new file logic
        if (debouncedSearchQuery && searchResults) {
            const sorted = [...activeData].sort((a, b) => {
                const aValue = sortOption.accessor(a);
                const bValue = sortOption.accessor(b);

                if (aValue === bValue) return 0;

                if (sortBy === "date") {
                    const aDate = new Date(aValue).getTime();
                    const bDate = new Date(bValue).getTime();
                    return sortDirection === "desc"
                        ? bDate - aDate
                        : aDate - bDate;
                }

                if (typeof aValue === "number" && typeof bValue === "number") {
                    return sortDirection === "desc"
                        ? bValue - aValue
                        : aValue - bValue;
                }

                const comparison = String(aValue).localeCompare(String(bValue));
                return sortDirection === "desc" ? -comparison : comparison;
            });
            return sorted;
        }

        // Check if new files were added (data length increased)
        const hasNewFiles = activeData.length > previousDataLength.current;
        const oldLength = previousDataLength.current;
        previousDataLength.current = activeData.length;

        if (hasNewFiles) {
            // Get the newest files (recently added)
            const newFilesCount = activeData.length - oldLength;
            const newFiles = activeData.slice(0, newFilesCount);
            const existingFiles = activeData.slice(newFilesCount);

            // Sort existing files normally
            const sortedExisting = existingFiles.sort((a, b) => {
                const aValue = sortOption.accessor(a);
                const bValue = sortOption.accessor(b);

                if (aValue === bValue) return 0;

                if (sortBy === "date") {
                    const aDate = new Date(aValue).getTime();
                    const bDate = new Date(bValue).getTime();
                    return sortDirection === "desc"
                        ? bDate - aDate
                        : aDate - bDate;
                }

                if (typeof aValue === "number" && typeof bValue === "number") {
                    return sortDirection === "desc"
                        ? bValue - aValue
                        : aValue - bValue;
                }

                const comparison = String(aValue).localeCompare(String(bValue));
                return sortDirection === "desc" ? -comparison : comparison;
            });

            // Return new files at top, then sorted existing files
            return [...newFiles, ...sortedExisting];
        }

        // Normal sorting when no new files
        const sorted = [...activeData].sort((a, b) => {
            const aValue = sortOption.accessor(a);
            const bValue = sortOption.accessor(b);

            if (aValue === bValue) return 0;

            if (sortBy === "date") {
                const aDate = new Date(aValue).getTime();
                const bDate = new Date(bValue).getTime();
                return sortDirection === "desc" ? bDate - aDate : aDate - bDate;
            }

            if (typeof aValue === "number" && typeof bValue === "number") {
                return sortDirection === "desc"
                    ? bValue - aValue
                    : aValue - bValue;
            }

            const comparison = String(aValue).localeCompare(String(bValue));
            return sortDirection === "desc" ? -comparison : comparison;
        });

        return sorted;
    }, [
        activeData,
        sortBy,
        sortDirection,
        debouncedSearchQuery,
        searchResults,
    ]);

    const handleSortChange = (newSortBy: string) => {
        setSortBy(newSortBy);
        setSortDirection(newSortBy === "date" ? "desc" : "asc");
    };

    const handleSelectAll = (checked: boolean | "indeterminate") => {
        if (checked) {
            setSelectedFiles(new Set(sortedData.map((file) => file.id)));
        } else {
            setSelectedFiles(new Set());
        }
    };

    const handleSelectFile = (
        fileId: string,
        checked: boolean | "indeterminate"
    ) => {
        const newSelected = new Set(selectedFiles);
        if (checked === true) {
            newSelected.add(fileId);
        } else {
            newSelected.delete(fileId);
        }
        setSelectedFiles(newSelected);
    };

    const handleToggleExpand = (fileId: string) => {
        const newExpanded = new Set(expandedFiles);
        if (newExpanded.has(fileId)) {
            newExpanded.delete(fileId);
        } else {
            newExpanded.add(fileId);
        }
        setExpandedFiles(newExpanded);
    };

    const isAllSelected =
        sortedData.length > 0 && selectedFiles.size === sortedData.length;
    const isSomeSelected =
        selectedFiles.size > 0 && selectedFiles.size < sortedData.length;

    // Reset loading state when data changes
    useEffect(() => {
        setIsLoadingMore(false);
    }, [data]);

    // Set up Intersection Observer for infinite scroll
    useEffect(() => {
        if (!hasMore || debouncedSearchQuery) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && !isLoadingMore) {
                    setIsLoadingMore(true);
                    onLoadMore?.(sortedData.length);
                }
            },
            { rootMargin: "100px" }
        );

        const trigger = loadMoreTriggerRef.current;
        if (trigger) observer.observe(trigger);

        return () => {
            if (trigger) observer.unobserve(trigger);
        };
    }, [
        hasMore,
        isLoadingMore,
        onLoadMore,
        sortedData.length,
        debouncedSearchQuery,
    ]);

    return (
        <>
            {/* Search and Sort Controls */}
            <div className="flex flex-col items-end md:flex-row md:items-center gap-2 sm:gap-4 mb-2 sm:mb-4">
                <SearchBar
                    value={searchQuery}
                    onChange={setSearchQuery}
                    placeholder="Search files..."
                />
                <SortControls
                    sortBy={sortBy}
                    sortDirection={sortDirection}
                    sortOptions={sortOptions}
                    onSortChange={handleSortChange}
                    onDirectionToggle={() =>
                        setSortDirection((prev) =>
                            prev === "asc" ? "desc" : "asc"
                        )
                    }
                />
            </div>

            {/* Settings Switches */}
            <SettingsSwitches className="mb-2 w-full justify-end" />

            <FileList>
                <FileListHeader
                    isAllSelected={
                        isSomeSelected ? "indeterminate" : isAllSelected
                    }
                    onSelectAll={handleSelectAll}
                />
                <FileListBody>
                    {sortedData.length > 0 ? (
                        <>
                            {sortedData.map((file) => (
                                <React.Fragment key={file.id}>
                                    <FileListItem
                                        file={file}
                                        isSelected={selectedFiles.has(file.id)}
                                        isExpanded={expandedFiles.has(file.id)}
                                        canExpand={file.status === "completed"}
                                        onToggleSelect={(checked) =>
                                            handleSelectFile(file.id, checked)
                                        }
                                        onToggleExpand={() =>
                                            handleToggleExpand(file.id)
                                        }
                                    />
                                    {expandedFiles.has(file.id) && (
                                        <div className="border-b border-border/40 bg-muted/10">
                                            <ExpandedRow file={file} />
                                        </div>
                                    )}
                                </React.Fragment>
                            ))}
                        </>
                    ) : (
                        <FileListEmpty />
                    )}
                </FileListBody>
            </FileList>

            {/* Infinite scroll trigger */}
            {hasMore && !debouncedSearchQuery && (
                <div
                    ref={loadMoreTriggerRef}
                    className="flex items-center justify-center py-2 sm:py-4"
                >
                    {isLoadingMore && (
                        <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                            <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                            Loading more...
                        </div>
                    )}
                </div>
            )}
        </>
    );
}
