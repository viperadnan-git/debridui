import { useAuthContext } from "@/app/(private)/layout";
import { useEffect } from "react";
import { PAGE_SIZE } from "@/lib/constants";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/query-client";
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
        removeFile,
    } = useFileStore();

    const { data, isLoading } = useQuery({
        queryKey: ["listFiles", currentUser.id, offset],
        queryFn: () => client.listFiles({ offset: 0, limit: PAGE_SIZE + offset }),
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

    const deleteFile = async (fileId: string) => {
        const message = await client.deleteFile(fileId);
        removeFile(fileId);
        queryClient.invalidateQueries({ queryKey: ["listFiles"] });
        queryClient.invalidateQueries({ queryKey: ["searchFiles"] });
        return message;
    };

    const retryFiles = async (fileIds: string[]) => {
        const message = await client.retryFile(fileIds);
        queryClient.invalidateQueries({ queryKey: ["listFiles"] });
        queryClient.invalidateQueries({ queryKey: ["searchFiles"] });
        return message;
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
        deleteFile,
        retryFiles,
    };
}
