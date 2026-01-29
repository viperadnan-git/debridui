"use client";

import { createContext, useContext, useState, useMemo, useCallback, ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthGuaranteed } from "@/components/auth/auth-provider";
import { WebDownload, WebDownloadAddResult } from "@/lib/types";
import { WEB_DOWNLOADS_PAGE_SIZE } from "@/lib/constants";

interface WebDownloadsContextValue {
    downloads: WebDownload[];
    isLoading: boolean;
    isRefetching: boolean;
    currentPage: number;
    totalPages: number;
    setPage: (page: number) => void;
    addDownloads: (links: string[]) => Promise<WebDownloadAddResult[]>;
    isAdding: boolean;
    saveLinks: ((links: string[]) => Promise<void>) | null;
    isSaving: boolean;
    deleteDownload: (id: string) => Promise<unknown>;
    getDownloadLink: (download: WebDownload) => Promise<string>;
    refetch: () => void;
}

const WebDownloadsContext = createContext<WebDownloadsContextValue | null>(null);

export function WebDownloadsProvider({ children }: { children: ReactNode }) {
    const { client, currentAccount } = useAuthGuaranteed();
    const queryClient = useQueryClient();
    const [currentPage, setCurrentPage] = useState(1);

    // Ephemeral state for clients that support it (unlocked links not saved to API)
    const [ephemeralLinks, setEphemeralLinks] = useState<WebDownload[]>([]);

    const offset = (currentPage - 1) * WEB_DOWNLOADS_PAGE_SIZE;
    const listKey = [currentAccount.id, "webDownloads", "list", currentPage] as const;

    const listQuery = useQuery({
        queryKey: listKey,
        queryFn: () => client.getWebDownloadList({ offset, limit: WEB_DOWNLOADS_PAGE_SIZE }),
        refetchInterval: client.refreshInterval,
    });

    // Merge API list with ephemeral links (if client supports them)
    const downloads = useMemo(() => {
        const apiDownloads = listQuery.data?.downloads ?? [];
        if (!client.supportsEphemeralLinks) return apiDownloads;
        // Only show ephemeral links on first page
        if (currentPage !== 1) return apiDownloads;
        const apiIds = new Set(apiDownloads.map((d) => d.id));
        return [...ephemeralLinks.filter((d) => !apiIds.has(d.id)), ...apiDownloads];
    }, [client.supportsEphemeralLinks, ephemeralLinks, listQuery.data, currentPage]);

    // Calculate total pages (same pattern as useFileExplorer)
    const totalPages = useMemo(() => {
        const data = listQuery.data;
        if (!data) return currentPage + 1;

        if (data.total !== undefined) {
            return Math.ceil(data.total / WEB_DOWNLOADS_PAGE_SIZE);
        }

        if (!data.hasMore) {
            return Math.ceil((offset + data.downloads.length) / WEB_DOWNLOADS_PAGE_SIZE);
        }

        return currentPage + 1;
    }, [listQuery.data, offset, currentPage]);

    const setPage = useCallback((page: number) => {
        setCurrentPage(Math.max(1, page));
    }, []);

    // Add/Unlock links
    const addMutation = useMutation({
        mutationFn: (links: string[]) => client.addWebDownloads(links),
        onSuccess: (results) => {
            if (client.supportsEphemeralLinks) {
                // Store unlocked links in ephemeral state
                const newLinks: WebDownload[] = [];
                for (const r of results) {
                    if (r.success) {
                        newLinks.push({
                            id: crypto.randomUUID(),
                            name: r.name || r.link.split("/").pop() || r.link,
                            originalLink: r.link,
                            downloadLink: r.downloadLink,
                            size: r.size,
                            status: "completed" as const,
                            createdAt: new Date(),
                        });
                    }
                }
                if (newLinks.length > 0) {
                    setEphemeralLinks((prev) => [...newLinks, ...prev]);
                }
            }
            // Invalidate all pages
            queryClient.invalidateQueries({ queryKey: [currentAccount.id, "webDownloads", "list"] });
        },
    });

    // Save links (optional, client-dependent)
    const saveMutation = useMutation({
        mutationFn: (links: string[]) => client.saveWebDownloadLinks!(links),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: [currentAccount.id, "webDownloads", "list"] }),
    });

    // Delete
    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            if (client.supportsEphemeralLinks) {
                const isEphemeral = ephemeralLinks.some((d) => d.id === id);
                if (isEphemeral) {
                    setEphemeralLinks((prev) => prev.filter((d) => d.id !== id));
                    return;
                }
            }
            await client.deleteWebDownload(id);
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: [currentAccount.id, "webDownloads", "list"] }),
    });

    const value = useMemo(
        () => ({
            downloads,
            isLoading: listQuery.isLoading,
            isRefetching: listQuery.isRefetching,
            currentPage,
            totalPages,
            setPage,
            addDownloads: addMutation.mutateAsync,
            isAdding: addMutation.isPending,
            saveLinks: client.saveWebDownloadLinks ? saveMutation.mutateAsync : null,
            isSaving: saveMutation.isPending,
            deleteDownload: deleteMutation.mutateAsync,
            getDownloadLink: async (download: WebDownload): Promise<string> => {
                // Use cached downloadLink if available
                if (download.downloadLink) {
                    return download.downloadLink;
                }
                // For clients with ephemeral links, saved links need unlocking
                if (client.supportsEphemeralLinks) {
                    const results = await client.addWebDownloads([download.originalLink]);
                    const result = results[0];
                    if (!result?.success || !result.downloadLink) {
                        throw new Error(result?.error || "Failed to unlock link");
                    }
                    return result.downloadLink;
                }
                // Fallback - shouldn't reach here for ready downloads
                throw new Error("Download link not available");
            },
            refetch: listQuery.refetch,
        }),
        [downloads, listQuery, currentPage, totalPages, setPage, addMutation, saveMutation, deleteMutation, client]
    );

    return <WebDownloadsContext.Provider value={value}>{children}</WebDownloadsContext.Provider>;
}

export function useWebDownloads() {
    const context = useContext(WebDownloadsContext);
    if (!context) throw new Error("useWebDownloads must be used within WebDownloadsProvider");
    return context;
}
