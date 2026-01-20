import { useAuthContext } from "@/lib/contexts/auth";
import { useEffect, useState, useMemo } from "react";
import { PAGE_SIZE } from "@/lib/constants";
import { useQuery } from "@tanstack/react-query";
import { useFileStore } from "@/lib/stores/files";
import { useSearchParams } from "next/navigation";
import { sortTorrentFiles } from "@/lib/utils/file";

export function useFileExplorer() {
    const { client, currentUser } = useAuthContext();
    const searchParams = useSearchParams();
    const [currentPage, setCurrentPage] = useState(1);
    const [totalEstimate, setTotalEstimate] = useState<number | null>(null);

    const { sortBy, sortOrder, setSortBy, setSortOrder } = useFileStore();

    // Initialize sort from URL params on mount, or reset to defaults
    useEffect(() => {
        const urlSortBy = searchParams.get("sort_by");
        const urlSortOrder = searchParams.get("sort_order") as "asc" | "desc" | null;

        if (urlSortBy) {
            setSortBy(urlSortBy);
        } else {
            setSortBy("date");
        }

        if (urlSortOrder && (urlSortOrder === "asc" || urlSortOrder === "desc")) {
            setSortOrder(urlSortOrder);
        } else {
            setSortOrder("desc");
        }
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

    // Update total estimate based on total or hasMore
    useEffect(() => {
        if (data) {
            if (data.total !== undefined) {
                // Use exact total if available
                setTotalEstimate(data.total);
            } else if (!data.hasMore) {
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
        if (totalEstimate === null) return currentPage + 1;
        return Math.ceil(totalEstimate / PAGE_SIZE);
    }, [totalEstimate, currentPage]);

    // Sort files locally
    const sortedFiles = useMemo(() => {
        if (!data?.files) return [];
        if (sortBy === "date" && sortOrder === "desc") return data.files;
        return sortTorrentFiles(data.files, sortBy, sortOrder);
    }, [data?.files, sortBy, sortOrder]);

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
        setSortBy,
        setSortOrder,
    };
}
