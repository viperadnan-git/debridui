"use client";

import { memo, useState } from "react";
import { WebDownload } from "@/lib/types";
import { formatSize } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { WebDownloadStatusBadge } from "@/components/display";
import { Copy, ExternalLink, Trash2, Loader2, Download } from "lucide-react";
import { toast } from "sonner";

interface DownloadItemProps {
    download: WebDownload;
    onDelete: (id: string) => Promise<unknown>;
    onGetLink: (download: WebDownload) => Promise<string>;
}

export const DownloadItem = memo(function DownloadItem({ download, onDelete, onGetLink }: DownloadItemProps) {
    const [loading, setLoading] = useState<"copy" | "download" | "open" | null>(null);
    const [deleting, setDeleting] = useState(false);

    const getLink = async (action: "copy" | "download" | "open") => {
        setLoading(action);
        try {
            const link = await onGetLink(download);
            return link;
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to get link");
            return null;
        } finally {
            setLoading(null);
        }
    };

    const handleCopy = async () => {
        const link = await getLink("copy");
        if (link) {
            await navigator.clipboard.writeText(link);
            toast.success("Link copied to clipboard");
        }
    };

    const handleDownload = async () => {
        const link = await getLink("download");
        if (link) {
            const a = document.createElement("a");
            a.href = link;
            a.download = download.name;
            a.target = "_blank";
            a.click();
        }
    };

    const handleOpen = async () => {
        const link = await getLink("open");
        if (link) {
            window.open(link, "_blank");
        }
    };

    const handleDelete = async () => {
        setDeleting(true);
        try {
            await onDelete(download.id);
            toast.success("Removed");
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to remove");
        } finally {
            setDeleting(false);
        }
    };

    const isReady = download.status === "completed" || download.status === "cached";
    const isActionDisabled = loading !== null;

    return (
        <div className="flex flex-col gap-2 px-4 py-3 border-b border-border/50 last:border-b-0 hover:bg-muted/30 transition-colors md:flex-row md:items-center md:gap-3">
            {/* Row 1: Name + Badge */}
            <div className="flex items-center gap-3 min-w-0 md:flex-1">
                <div className="flex-1 min-w-0">
                    <div className="text-sm truncate font-medium">{download.name}</div>
                </div>
                <WebDownloadStatusBadge status={download.status} />
            </div>
            {/* Row 2: Meta + Actions */}
            <div className="flex items-center justify-between gap-3 md:justify-end">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {download.host ? <span>{download.host}</span> : null}
                    {download.host && download.size ? <span className="text-border">·</span> : null}
                    {download.size ? <span>{formatSize(download.size)}</span> : null}
                    {download.status === "processing" && download.progress !== undefined && download.progress < 100 && (
                        <>
                            <span className="text-border">·</span>
                            <span>{Math.round(download.progress)}%</span>
                        </>
                    )}
                    {download.error ? (
                        <>
                            <span className="text-border">·</span>
                            <span className="text-red-500">{download.error}</span>
                        </>
                    ) : null}
                </div>
                <div className="flex gap-1">
                    {isReady ? (
                        <>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="size-8"
                                onClick={handleCopy}
                                disabled={isActionDisabled}
                                title="Copy link">
                                {loading === "copy" ? (
                                    <Loader2 className="size-4 animate-spin" />
                                ) : (
                                    <Copy className="size-4" />
                                )}
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="size-8"
                                onClick={handleDownload}
                                disabled={isActionDisabled}
                                title="Download">
                                {loading === "download" ? (
                                    <Loader2 className="size-4 animate-spin" />
                                ) : (
                                    <Download className="size-4" />
                                )}
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="size-8"
                                onClick={handleOpen}
                                disabled={isActionDisabled}
                                title="Open">
                                {loading === "open" ? (
                                    <Loader2 className="size-4 animate-spin" />
                                ) : (
                                    <ExternalLink className="size-4" />
                                )}
                            </Button>
                        </>
                    ) : null}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-muted-foreground hover:text-destructive"
                        onClick={handleDelete}
                        disabled={deleting}
                        title="Remove">
                        {deleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                    </Button>
                </div>
            </div>
        </div>
    );
});

export function DownloadItemSkeleton() {
    return (
        <div className="flex flex-col gap-2 px-4 py-3 border-b border-border/50 last:border-b-0 md:flex-row md:items-center md:gap-3">
            <div className="flex items-center gap-3 min-w-0 md:flex-1">
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-5 w-16 rounded-xl" />
            </div>
            <div className="flex items-center justify-between gap-3 md:justify-end">
                <Skeleton className="h-3 w-24" />
                <div className="flex gap-1">
                    <Skeleton className="size-8 rounded-md" />
                    <Skeleton className="size-8 rounded-md" />
                    <Skeleton className="size-8 rounded-md" />
                </div>
            </div>
        </div>
    );
}
