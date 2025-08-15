"use client";

import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    getSortedRowModel,
    getExpandedRowModel,
    SortingState,
    ExpandedState,
    useReactTable,
} from "@tanstack/react-table";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { ExpandedRow } from "./expanded-row";
import { SearchBar } from "./search-bar";
import { SortControls, SortOption } from "./sort-controls";
import { DebridFile } from "@/lib/clients/types";
import { useAuthContext } from "@/app/(private)/layout";
import { useQuery } from "@tanstack/react-query";
import React, { useState, useMemo, useRef, useEffect } from "react";
import { Loader2 } from "lucide-react";

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
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
        accessor: (file: DebridFile) => file.completedAt || file.createdAt,
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

export function DataTable<TData, TValue>({ columns, data, hasMore = false, onLoadMore }: DataTableProps<TData, TValue>) {
    const [sortBy, setSortBy] = useState<string>("date");
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
    const [sorting, setSorting] = useState<SortingState>([]);
    const [expanded, setExpanded] = useState<ExpandedState>({});
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const previousDataLength = useRef(data.length);
    const loadMoreTriggerRef = useRef<HTMLDivElement>(null);
    const { client } = useAuthContext();

    // Search query with debounce
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState<string>("");

    React.useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchQuery(searchQuery);
        }, 1000);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Search files query
    const { data: searchResults } = useQuery({
        queryKey: ["searchFiles", debouncedSearchQuery],
        queryFn: () =>
            client.searchFiles ? client.searchFiles(debouncedSearchQuery) : Promise.resolve([]),
        enabled: !!debouncedSearchQuery && !!client.searchFiles,
        staleTime: 5_000, // 5 seconds
    });

    // Use search results if searching, otherwise use provided data
    const activeData = debouncedSearchQuery && searchResults ? searchResults : data;

    // Track new files to put them at the top
    const sortedData = useMemo(() => {
        const sortOption = sortOptions.find((opt) => opt.value === sortBy);
        if (!sortOption) return activeData;

        // For search results, just sort normally without new file logic
        if (debouncedSearchQuery && searchResults) {
            const sorted = [...activeData].sort((a, b) => {
                const aValue = sortOption.accessor(a as DebridFile);
                const bValue = sortOption.accessor(b as DebridFile);

                if (aValue === bValue) return 0;

                if (sortBy === "date") {
                    const aDate = new Date(aValue).getTime();
                    const bDate = new Date(bValue).getTime();
                    return sortDirection === "desc" ? bDate - aDate : aDate - bDate;
                }

                if (typeof aValue === "number" && typeof bValue === "number") {
                    return sortDirection === "desc" ? bValue - aValue : aValue - bValue;
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
                const aValue = sortOption.accessor(a as DebridFile);
                const bValue = sortOption.accessor(b as DebridFile);

                if (aValue === bValue) return 0;

                if (sortBy === "date") {
                    const aDate = new Date(aValue).getTime();
                    const bDate = new Date(bValue).getTime();
                    return sortDirection === "desc" ? bDate - aDate : aDate - bDate;
                }

                if (typeof aValue === "number" && typeof bValue === "number") {
                    return sortDirection === "desc" ? bValue - aValue : aValue - bValue;
                }

                const comparison = String(aValue).localeCompare(String(bValue));
                return sortDirection === "desc" ? -comparison : comparison;
            });

            // Return new files at top, then sorted existing files
            return [...newFiles, ...sortedExisting];
        }

        // Normal sorting when no new files
        const sorted = [...activeData].sort((a, b) => {
            const aValue = sortOption.accessor(a as DebridFile);
            const bValue = sortOption.accessor(b as DebridFile);

            if (aValue === bValue) return 0;

            if (sortBy === "date") {
                const aDate = new Date(aValue).getTime();
                const bDate = new Date(bValue).getTime();
                return sortDirection === "desc" ? bDate - aDate : aDate - bDate;
            }

            if (typeof aValue === "number" && typeof bValue === "number") {
                return sortDirection === "desc" ? bValue - aValue : aValue - bValue;
            }

            const comparison = String(aValue).localeCompare(String(bValue));
            return sortDirection === "desc" ? -comparison : comparison;
        });

        return sorted;
    }, [activeData, sortBy, sortDirection, debouncedSearchQuery, searchResults]);

    const table = useReactTable({
        data: sortedData,
        columns: columns as ColumnDef<TData | DebridFile>[],
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getExpandedRowModel: getExpandedRowModel(),
        onSortingChange: setSorting,
        onExpandedChange: setExpanded,
        getRowCanExpand: (row) => (row.original as DebridFile).status === "completed",
        state: {
            sorting,
            expanded,
        },
    });

    const handleRowClick = (row: { original: DebridFile; toggleExpanded: () => void }) => {
        if (row.original.status === "completed") {
            row.toggleExpanded();
        }
    };

    const handleSortChange = (newSortBy: string) => {
        // New field selected, set field and use default direction
        setSortBy(newSortBy);
        setSortDirection(newSortBy === "date" ? "desc" : "asc");
    };

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
    }, [hasMore, isLoadingMore, onLoadMore, sortedData.length, debouncedSearchQuery]);

    return (
        <>
            {/* Search and Sort Controls */}
            <div className="flex items-center gap-4 mb-4">
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
                        setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"))
                    }
                />
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => {
                                    return (
                                        <TableHead key={header.id}>
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                      header.column.columnDef.header,
                                                      header.getContext()
                                                  )}
                                        </TableHead>
                                    );
                                })}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <React.Fragment key={row.id}>
                                    <TableRow
                                        data-state={row.getIsSelected() && "selected"}
                                        className={`${(row.original as DebridFile).status === "completed" ? "cursor-pointer hover:bg-muted/50" : ""} ${row.getIsExpanded() ? "bg-muted/20" : ""}`}
                                        onClick={() => handleRowClick(row as { original: DebridFile; toggleExpanded: () => void })}
                                    >
                                        {row.getVisibleCells().map((cell) => (
                                            <TableCell key={cell.id}>
                                                {flexRender(
                                                    cell.column.columnDef.cell,
                                                    cell.getContext()
                                                )}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                    {row.getIsExpanded() && (
                                        <TableRow>
                                            <TableCell colSpan={columns.length} className="p-0">
                                                <ExpandedRow file={row.original as DebridFile} />
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </React.Fragment>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-24 text-center">
                                    No results.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
                
            </div>
            
            {/* Infinite scroll trigger */}
            {hasMore && !debouncedSearchQuery && (
                <div 
                    ref={loadMoreTriggerRef}
                    className="flex items-center justify-center py-4"
                >
                    {isLoadingMore && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Loading more...
                        </div>
                    )}
                </div>
            )}
        </>
    );
}
