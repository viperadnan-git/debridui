import { useQuery } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import { useAuthGuaranteed } from "@/components/auth/auth-provider";
import { PAGE_SIZE } from "@/lib/constants";
import { sortTorrentFiles } from "@/lib/utils/file";

export function useFileExplorer() {
    const { client, currentAccount } = useAuthGuaranteed();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const searchParamsString = searchParams.toString();

    const sortBy = searchParams.get("sort_by") || "date";
    const sortOrder = (searchParams.get("sort_order") as "asc" | "desc") || "desc";
    const currentPage = Math.max(1, Number(searchParams.get("page")) || 1);

    const offset = (currentPage - 1) * PAGE_SIZE;
    const limit = PAGE_SIZE;

    const { data, isLoading } = useQuery({
        queryKey: [currentAccount.id, "getTorrentList", currentPage, sortBy, sortOrder],
        queryFn: () => client.getTorrentList({ offset, limit }),
        refetchInterval: 3000,
        refetchIntervalInBackground: false,
    });

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

    const sortedFiles = useMemo(() => {
        if (!data?.files) return [];
        if (sortBy === "date" && sortOrder === "desc") return data.files;
        return sortTorrentFiles(data.files, sortBy, sortOrder);
    }, [data, sortBy, sortOrder]);

    const setPage = useCallback(
        (page: number) => {
            if (page < 1 || page === currentPage) return;
            const params = new URLSearchParams(searchParamsString);
            if (page === 1) params.delete("page");
            else params.set("page", String(page));
            const query = params.toString();
            router.push(query ? `${pathname}?${query}` : pathname);
        },
        [currentPage, pathname, router, searchParamsString]
    );

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
