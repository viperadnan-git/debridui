import { useAuthContext } from "@/lib/contexts/auth";
import { useEffect, useState, useMemo } from "react";
import { PAGE_SIZE } from "@/lib/constants";
import { useQuery } from "@tanstack/react-query";
import { useFileStore } from "@/lib/stores/files";
import { useSearchParams } from "next/navigation";

export function useFileExplorer() {
    const { client, currentUser } = useAuthContext();
    const searchParams = useSearchParams();
    const [currentPage, setCurrentPage] = useState(1);
    const [totalEstimate, setTotalEstimate] = useState<number | null>(null);
    const [initialized, setInitialized] = useState(false);

    const { files: sortedFiles, sortBy, sortOrder, sortChanged, setFiles, setSortBy, setSortOrder } = useFileStore();

    // Initialize sort from URL params on mount
    useEffect(() => {
        if (initialized) return;

        const urlSortBy = searchParams.get("sort_by");
        const urlSortOrder = searchParams.get("sort_order") as "asc" | "desc" | null;

        // If URL params exist, sync store with them
        if (urlSortBy) {
            setSortBy(urlSortBy);
        }
        if (urlSortOrder && (urlSortOrder === "asc" || urlSortOrder === "desc")) {
            setSortOrder(urlSortOrder);
        }

        setInitialized(true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Calculate pagination values
    const offset = useMemo(() => (currentPage - 1) * PAGE_SIZE, [currentPage]);
    const limit = PAGE_SIZE;

    const { data, isLoading } = useQuery({
        queryKey: [currentUser.id, "getTorrentList", currentPage, sortBy, sortOrder],
        queryFn: () => client.getTorrentList({ offset, limit }),
        refetchInterval: 3000,
        staleTime: 0,
    });

    // Update total estimate based on hasMore
    useEffect(() => {
        if (data) {
            if (!data.hasMore) {
                // We've reached the end, calculate exact total
                setTotalEstimate(offset + data.files.length);
            } else if (totalEstimate === null || totalEstimate < offset + limit + 1) {
                // Estimate at least one more page exists
                setTotalEstimate(offset + limit + 1);
            }
        }
    }, [data, offset, limit, totalEstimate]);

    // Calculate total pages
    const totalPages = useMemo(() => {
        if (totalEstimate === null) return currentPage + 1; // Show at least one more page
        return Math.ceil(totalEstimate / PAGE_SIZE);
    }, [totalEstimate, currentPage]);

    // Update store with sorted files
    useEffect(() => {
        if (data?.files) {
            setFiles(data.files);
        }
    }, [data, setFiles]);

    const setPage = (page: number) => {
        if (page >= 1) {
            setCurrentPage(page);
        }
    };

    return {
        files: sortedFiles,
        isLoading,
        currentPage,
        totalPages,
        setPage,
        sortBy,
        sortOrder,
        sortChanged,
        setSortBy,
        setSortOrder,
    };
}
