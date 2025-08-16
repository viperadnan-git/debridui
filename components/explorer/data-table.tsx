"use client";

import React, {
    useState,
    useMemo,
    useRef,
    useEffect,
    useCallback,
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { DebridFile, DebridFileNode } from "@/lib/clients/types";
import { useAuthContext } from "@/app/(private)/layout";
import { SearchBar } from "./search-bar";
import { SortControls, SortOption } from "./sort-controls";
import { FileList, FileListBody, FileListEmpty } from "./file-list";
import { FileListHeader } from "./file-list-header";
import { FileListItem } from "./file-list-item";
import { ExpandedRow } from "./expanded-row";
import { SettingsSwitches } from "./settings-switches";
import { FileActionsDrawer } from "./file-actions-drawer";
import { useHierarchicalSelection } from "@/hooks/use-selection";

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
    const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());
    const loadMoreTriggerRef = useRef<HTMLDivElement>(null);
    const { client } = useAuthContext();

    // Use the hierarchical selection hook
    const selection = useHierarchicalSelection();
    const queryClient = useQueryClient();

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
        // Data comes pre-sorted by date desc, skip sorting if that's selected
        if (sortBy === "date" && sortDirection === "desc") {
            return activeData;
        }

        const sortOption = sortOptions.find((opt) => opt.value === sortBy);
        if (!sortOption) return activeData;

        // Sort all items together
        return [...activeData].sort((a, b) => {
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
    }, [activeData, sortBy, sortDirection]);

    const handleSortChange = (newSortBy: string) => {
        setSortBy(newSortBy);
        setSortDirection(newSortBy === "date" ? "desc" : "asc");
    };

    const handleSelectAll = (checked: boolean | "indeterminate") => {
        if (checked) {
            selection.selectAll(sortedData.map((file) => file.id));
        } else {
            selection.clearAll();
        }
    };

    const handleSelectFile = (fileId: string) => {
        // Get all node IDs for this file from cache
        const fileNodes = queryClient.getQueryData<DebridFileNode[]>([
            "getFile",
            fileId,
        ]);
        const allNodeIds: string[] = [];

        if (fileNodes) {
            const collectNodeIds = (nodes: DebridFileNode[]): void => {
                nodes.forEach((node) => {
                    if (node.id) allNodeIds.push(node.id);
                    if (node.children) collectNodeIds(node.children);
                });
            };
            collectNodeIds(fileNodes);
        }

        selection.toggleFileSelection(fileId, allNodeIds);
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

    const handleNodeSelectionChange = useCallback(
        (fileId: string, nodeIds: Set<string>) => {
            selection.updateNodeSelection(fileId, nodeIds);
        },
        [selection]
    );

    const handleNodesLoaded = useCallback(
        (fileId: string, nodeIds: string[]) => {
            selection.registerFileNodes(fileId, nodeIds);
        },
        [selection]
    );

    // Calculate header checkbox state
    const getHeaderCheckboxState = (): boolean | "indeterminate" => {
        if (sortedData.length === 0) return false;

        const allFilesSelected = sortedData.every((file) =>
            selection.selectedFileIds.has(file.id)
        );

        const someFilesSelected = sortedData.some((file) =>
            selection.selectedFileIds.has(file.id)
        );

        const hasIndeterminateFiles = sortedData.some(
            (file) =>
                selection.getFileSelectionState(file.id) === "indeterminate"
        );

        if (allFilesSelected && !hasIndeterminateFiles) {
            // All files fully selected
            return true;
        } else if (someFilesSelected || hasIndeterminateFiles) {
            // Some files selected or some files partially selected
            return "indeterminate";
        }
        return false;
    };

    const headerCheckboxState = getHeaderCheckboxState();

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

            <FileList className="-mx-4 md:-mx-0">
                <FileListHeader
                    isAllSelected={headerCheckboxState}
                    onSelectAll={handleSelectAll}
                />
                <FileListBody>
                    {sortedData.length > 0 ? (
                        <>
                            {sortedData.map((file) => (
                                <React.Fragment key={file.id}>
                                    <FileListItem
                                        file={file}
                                        isSelected={
                                            selection.getFileSelectionState(
                                                file.id
                                            ) === "indeterminate"
                                                ? false
                                                : selection.getFileSelectionState(
                                                      file.id
                                                  ) === true
                                        }
                                        canExpand={file.status === "completed"}
                                        onToggleSelect={() =>
                                            handleSelectFile(file.id)
                                        }
                                        onToggleExpand={() =>
                                            handleToggleExpand(file.id)
                                        }
                                    />
                                    {expandedFiles.has(file.id) && (
                                        <div className="border-b border-border/40 bg-muted/10">
                                            <ExpandedRow
                                                file={file}
                                                selectedNodes={
                                                    selection.selectedNodesByFile.get(
                                                        file.id
                                                    ) || new Set()
                                                }
                                                onNodeSelectionChange={(
                                                    nodeSelection
                                                ) =>
                                                    handleNodeSelectionChange(
                                                        file.id,
                                                        nodeSelection
                                                    )
                                                }
                                                onNodesLoaded={(
                                                    nodeIds: string[]
                                                ) =>
                                                    handleNodesLoaded(
                                                        file.id,
                                                        nodeIds
                                                    )
                                                }
                                            />
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

            {/* Bottom Actions Drawer */}
            <FileActionsDrawer
                selectedFileIds={selection.selectedFileIds}
                selectedNodeIds={selection.getAllSelectedNodeIds()}
                fullySelectedFileIds={selection.getFullySelectedFileIds()}
                files={sortedData}
            />
        </>
    );
}
