import { useAuthContext } from "@/lib/contexts/auth";
import { useEffect } from "react";
import { PAGE_SIZE } from "@/lib/constants";
import { useQuery } from "@tanstack/react-query";
import { useFileStore } from "@/lib/stores/files";

export function useFileExplorer() {
    const { client, currentUser } = useAuthContext();
    const {
        files,
        offset,
        hasMore,
        sortBy,
        sortOrder,
        sortChanged,
        addFiles,
        setOffset,
        setSortBy,
        setSortOrder,
    } = useFileStore();

    const { data, isLoading } = useQuery({
        queryKey: [currentUser.id, "getTorrentList", offset],
        queryFn: () =>
            client.getTorrentList({ offset: 0, limit: PAGE_SIZE + offset }),
        refetchInterval: 3000,
        staleTime: 0,
    });

    useEffect(() => {
        if (data) {
            addFiles(data.files || []);
        }
    }, [data, addFiles]);

    const loadMore = (offset: number) => {
        setOffset(offset);
    };

    return {
        files,
        offset,
        hasMore,
        isLoading,
        sortBy,
        sortOrder,
        sortChanged,
        setSortBy,
        setSortOrder,
        loadMore,
    };
}
