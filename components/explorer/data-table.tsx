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
import { useAuthContext } from "@/lib/contexts/auth";
import { SearchBar } from "./search-bar";
import { SortControls, SortOption } from "./sort-controls";
import { FileList, FileListBody, FileListEmpty } from "./file-list";
import { FileListHeader } from "./file-list-header";
import { FileListItem } from "./file-list-item";
import { ExpandedRow } from "./expanded-row";
import { FileActionsDrawer } from "./file-actions-drawer";
import { useSelectionStore } from "@/lib/stores/selection";
import { useFileStore } from "@/lib/stores/files";
import { useSettingsStore } from "@/lib/stores/settings";
import { processFileNodes } from "@/lib/utils/file";

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
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());
    const loadMoreTriggerRef = useRef<HTMLDivElement>(null);
    const { client, currentUser } = useAuthContext();
    const { sortBy, sortOrder, setSortBy, setSortOrder } = useFileStore();

    // Use the selection store
    const {
        selectedFileIds,
        selectedNodesByFile,
        toggleFileSelection,
        updateNodeSelection,
        getFileSelectionState,
        registerFileNodes,
        selectAll,
        clearAll,
        getAllSelectedNodeIds,
        getFullySelectedFileIds,
    } = useSelectionStore();
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
        queryKey: [currentUser.id, "findTorrents", debouncedSearchQuery],
        queryFn: () =>
            client.findTorrents
                ? client.findTorrents(debouncedSearchQuery)
                : Promise.resolve([]),
        enabled: !!debouncedSearchQuery && !!client.findTorrents,
        staleTime: 5_000,
    });

    const activeData = useMemo(() => {
        if (debouncedSearchQuery && searchResults) {
            return searchResults;
        }
        return data;
    }, [debouncedSearchQuery, searchResults, data]);

    const handleSortChange = (newSortBy: string) => {
        setSortBy(newSortBy);
        setSortOrder(newSortBy === "date" ? "desc" : "asc");
    };

    const handleSelectAll = (checked: boolean | "indeterminate") => {
        if (checked) {
            selectAll(data.map((file) => file.id));
        } else {
            clearAll();
        }
    };

    const handleSelectFile = (fileId: string) => {
        // Get all node IDs for this file from cache
        const fileNodes = queryClient.getQueryData<DebridFileNode[]>([
            currentUser.id,
            "getTorrentFiles",
            fileId,
        ]);
        
        const allNodeIds: string[] = [];
        
        if (fileNodes) {
            // Only apply filtering if hideTrash is enabled
            const { smartOrder, hideTrash } = useSettingsStore.getState();
            const processedNodes = processFileNodes(fileNodes, smartOrder, hideTrash);
            
            const collectNodeIds = (nodes: DebridFileNode[]): void => {
                nodes.forEach((node) => {
                    // Only collect file IDs, not folder IDs (to match ExpandedRow behavior)
                    if (node.type === "file" && node.id) {
                        allNodeIds.push(node.id);
                    }
                    if (node.children) collectNodeIds(node.children);
                });
            };
            collectNodeIds(processedNodes);
        }

        toggleFileSelection(fileId, allNodeIds);
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
            updateNodeSelection(fileId, nodeIds);
        },
        [updateNodeSelection]
    );

    const handleNodesLoaded = useCallback(
        (fileId: string, nodeIds: string[]) => {
            registerFileNodes(fileId, nodeIds);
        },
        [registerFileNodes]
    );

    // Calculate header checkbox state
    const getHeaderCheckboxState = (): boolean | "indeterminate" => {
        if (activeData.length === 0) return false;

        const allFilesSelected = activeData.every((file) =>
            selectedFileIds.has(file.id)
        );

        const someFilesSelected = activeData.some((file) =>
            selectedFileIds.has(file.id)
        );

        const hasIndeterminateFiles = activeData.some(
            (file) => getFileSelectionState(file.id) === "indeterminate"
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
                    console.log("loadMore", activeData.length);
                    onLoadMore?.(activeData.length);
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
        activeData.length,
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
                    sortDirection={sortOrder}
                    sortOptions={sortOptions}
                    onSortChange={handleSortChange}
                    onDirectionToggle={() =>
                        setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                    }
                />
            </div>

            <FileList className="max-sm:-mx-4">
                <FileListHeader
                    isAllSelected={headerCheckboxState}
                    onSelectAll={handleSelectAll}
                />
                <FileListBody>
                    {activeData.length > 0 ? (
                        <>
                            {activeData.map((file) => (
                                <React.Fragment key={file.id}>
                                    <FileListItem
                                        file={file}
                                        isSelected={getFileSelectionState(
                                            file.id
                                        )}
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
                                                    selectedNodesByFile.get(
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
                selectedFileIds={selectedFileIds}
                selectedNodeIds={getAllSelectedNodeIds()}
                fullySelectedFileIds={getFullySelectedFileIds()}
                files={activeData}
            />
        </>
    );
}
