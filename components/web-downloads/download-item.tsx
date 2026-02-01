"use client";

import { memo, useState, useMemo } from "react";
import { WebDownload, FileType, MediaPlayer } from "@/lib/types";
import { formatSize, cn, getFileType, openInPlayer } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { WebDownloadStatusBadge } from "@/components/display";
import { canPreviewFile } from "@/lib/preview/registry";
import { useSettingsStore } from "@/lib/stores/settings";
import { usePreviewStore } from "@/lib/stores/preview";
import { Copy, Trash2, Loader2, Download, PlayCircle, View } from "lucide-react";
import { toast } from "sonner";

interface DownloadItemProps {
    download: WebDownload;
    onDelete: (id: string) => Promise<unknown>;
    onGetLink: (download: WebDownload) => Promise<string>;
    isSelected?: boolean;
    onToggleSelect?: (id: string) => void;
}

export const DownloadItem = memo(function DownloadItem({
    download,
    onDelete,
    onGetLink,
    isSelected = false,
    onToggleSelect,
}: DownloadItemProps) {
    const [loading, setLoading] = useState<"copy" | "download" | "preview" | null>(null);
    const [deleting, setDeleting] = useState(false);
    const { get } = useSettingsStore();
    const openSinglePreview = usePreviewStore((s) => s.openSinglePreview);

    const fileType = useMemo(() => getFileType(download.name), [download.name]);
    const isPreviewable = useMemo(() => canPreviewFile(fileType), [fileType]);
    const isVideo = fileType === FileType.VIDEO;
    const mediaPlayer = get("mediaPlayer");
    const usesExternalPlayer = isVideo && mediaPlayer !== MediaPlayer.BROWSER;

    const getLink = async (action: "copy" | "download" | "preview") => {
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

    const handlePreview = async () => {
        const link = await getLink("preview");
        if (!link) return;

        if (usesExternalPlayer) {
            openInPlayer({ url: link, fileName: download.name, player: mediaPlayer });
        } else {
            openSinglePreview({ url: link, title: download.name, fileType });
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
        <div
            className={cn(
                "group flex items-start gap-2.5 px-3 py-2 border-b border-border/50 last:border-b-0 transition-colors",
                isSelected ? "bg-primary/5" : "hover:bg-muted/20"
            )}>
            {/* Checkbox */}
            {onToggleSelect && (
                <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => onToggleSelect(download.id)}
                    aria-label={`Select ${download.name}`}
                    className="mt-0.5"
                />
            )}

            {/* Content */}
            <div className="flex-1 min-w-0 space-y-1">
                {/* Name + Badge */}
                <div className="flex flex-wrap items-start gap-x-2 gap-y-0.5">
                    <span className="text-sm font-medium leading-tight break-words min-w-0 flex-1">
                        {download.name}
                    </span>
                    <WebDownloadStatusBadge status={download.status} />
                </div>

                {/* Meta + Actions */}
                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                    <div className="flex items-center gap-1.5 text-[11px] md:text-xs text-muted-foreground">
                        {download.host && <span>{download.host}</span>}
                        {download.host && download.size ? <span className="text-border">·</span> : null}
                        {download.size ? <span className="tabular-nums">{formatSize(download.size)}</span> : null}
                        {download.status === "processing" &&
                            download.progress !== undefined &&
                            download.progress < 100 && (
                                <>
                                    <span className="text-border">·</span>
                                    <span className="tabular-nums text-foreground/70">
                                        {Math.round(download.progress)}%
                                    </span>
                                </>
                            )}
                        {download.error && (
                            <>
                                <span className="text-border">·</span>
                                <span className="text-destructive">{download.error}</span>
                            </>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-0.5 shrink-0">
                        {isReady && (
                            <>
                                {isPreviewable && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="size-7 md:size-8 text-muted-foreground hover:text-foreground"
                                        onClick={handlePreview}
                                        disabled={isActionDisabled}
                                        title={usesExternalPlayer ? "Play" : "Preview"}>
                                        {loading === "preview" ? (
                                            <Loader2 className="size-3.5 md:size-4 animate-spin" />
                                        ) : usesExternalPlayer ? (
                                            <PlayCircle className="size-3.5 md:size-4" />
                                        ) : (
                                            <View className="size-3.5 md:size-4" />
                                        )}
                                    </Button>
                                )}
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-7 md:size-8 text-muted-foreground hover:text-foreground"
                                    onClick={handleCopy}
                                    disabled={isActionDisabled}
                                    title="Copy">
                                    {loading === "copy" ? (
                                        <Loader2 className="size-3.5 md:size-4 animate-spin" />
                                    ) : (
                                        <Copy className="size-3.5 md:size-4" />
                                    )}
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-7 md:size-8 text-muted-foreground hover:text-foreground"
                                    onClick={handleDownload}
                                    disabled={isActionDisabled}
                                    title="Download">
                                    {loading === "download" ? (
                                        <Loader2 className="size-3.5 md:size-4 animate-spin" />
                                    ) : (
                                        <Download className="size-3.5 md:size-4" />
                                    )}
                                </Button>
                            </>
                        )}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="size-7 md:size-8 text-muted-foreground hover:text-destructive"
                            onClick={handleDelete}
                            disabled={deleting}
                            title="Remove">
                            {deleting ? (
                                <Loader2 className="size-3.5 md:size-4 animate-spin" />
                            ) : (
                                <Trash2 className="size-3.5 md:size-4" />
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
});

export function DownloadItemSkeleton() {
    return (
        <div className="flex items-start gap-2.5 px-3 py-2 border-b border-border/50 last:border-b-0">
            <Skeleton className="size-4 rounded-sm mt-0.5" />
            <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-start gap-2">
                    <Skeleton className="h-4 flex-1 max-w-[70%]" />
                    <Skeleton className="h-5 w-14 rounded-sm" />
                </div>
                <div className="flex items-center justify-between gap-3">
                    <Skeleton className="h-3 w-32" />
                    <div className="flex gap-0.5 shrink-0">
                        <Skeleton className="size-7 md:size-8 rounded-sm" />
                        <Skeleton className="size-7 md:size-8 rounded-sm" />
                        <Skeleton className="size-7 md:size-8 rounded-sm" />
                        <Skeleton className="size-7 md:size-8 rounded-sm" />
                    </div>
                </div>
            </div>
        </div>
    );
}
