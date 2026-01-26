import { useAuthGuaranteed } from "@/components/auth/auth-provider";
import { useState, useMemo } from "react";
import { PAGE_SIZE } from "@/lib/constants";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { sortTorrentFiles } from "@/lib/utils/file";

export function useFileExplorer() {
    const { client, currentAccount } = useAuthGuaranteed();
    const searchParams = useSearchParams();
    const [currentPage, setCurrentPage] = useState(1);

    const sortBy = searchParams.get("sort_by") || "date";
    const sortOrder = (searchParams.get("sort_order") as "asc" | "desc") || "desc";

    // Calculate pagination values
    const offset = useMemo(() => (currentPage - 1) * PAGE_SIZE, [currentPage]);
    const limit = PAGE_SIZE;

    const { data, isLoading } = useQuery({
        queryKey: [currentAccount.id, "getTorrentList", currentPage, sortBy, sortOrder],
        queryFn: () => client.getTorrentList({ offset, limit }),
        refetchInterval: 3000,
    });

    // Calculate total pages from data
    const totalPages = useMemo(() => {
        if (!data) return currentPage + 1;

        if (data.total !== undefined) {
            return Math.ceil(data.total / PAGE_SIZE);
        }

        if (!data.hasMore) {
            return Math.ceil((offset + data.files.length) / PAGE_SIZE);
        }

        return currentPage + 1;
    }, [data, offset, currentPage]);

    // Sort files locally
    const sortedFiles = useMemo(() => {
        if (!data?.files) return [];
        if (sortBy === "date" && sortOrder === "desc") return data.files;
        return sortTorrentFiles(data.files, sortBy, sortOrder);
    }, [data, sortBy, sortOrder]);

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
    };
}
