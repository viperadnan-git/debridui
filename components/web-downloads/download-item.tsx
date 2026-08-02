"use client";

import { Copy, Download, Loader2, Lock, LockOpen, PlayCircle, Trash2, View } from "lucide-react";
import { memo, useMemo, useState } from "react";
import { toast } from "sonner";
import { WebDownloadStatusBadge } from "@/components/display";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { openInPlayer } from "@/lib/media/player";
import { canPreviewFile } from "@/lib/preview/registry";
import { usePreviewStore } from "@/lib/stores/preview";
import { useSettingsStore } from "@/lib/stores/settings";
import { FileType, MediaPlayer, type WebDownload } from "@/lib/types";
import { cn, formatSize, getFileType } from "@/lib/utils";

interface DownloadItemProps {
    download: WebDownload;
    onDelete: (id: string) => Promise<unknown>;
    onGetLink: (download: WebDownload) => Promise<string>;
    onSetAirlocked?: ((params: { id: string; airlocked: boolean }) => Promise<unknown>) | null;
    isSelected?: boolean;
    onToggleSelect?: (id: string) => void;
}

export const DownloadItem = memo(function DownloadItem({
    download,
    onDelete,
    onGetLink,
    onSetAirlocked,
    isSelected = false,
    onToggleSelect,
}: DownloadItemProps) {
    const [loading, setLoading] = useState<"copy" | "download" | "preview" | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [airlocking, setAirlocking] = useState(false);
    const openSinglePreview = usePreviewStore((s) => s.openSinglePreview);

    const fileType = useMemo(() => getFileType(download.name), [download.name]);
    const isPreviewable = useMemo(() => canPreviewFile(fileType), [fileType]);
    const isVideo = fileType === FileType.VIDEO;
    const mediaPlayer = useSettingsStore((s) => s.settings.mediaPlayer);
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

    const handleAirlock = async () => {
        setAirlocking(true);
        try {
            await onSetAirlocked?.({ id: download.id, airlocked: !download.airlocked });
            toast.success(download.airlocked ? "Removed from Airlock" : "Added to Airlock");
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to update Airlock");
        } finally {
            setAirlocking(false);
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
                    <span className="text-sm font-medium leading-tight wrap-break-word min-w-0 flex-1">
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
                                {onSetAirlocked && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className={cn(
                                            "size-7 md:size-8 hover:text-foreground",
                                            download.airlocked ? "text-foreground" : "text-muted-foreground"
                                        )}
                                        onClick={handleAirlock}
                                        disabled={airlocking}
                                        title={download.airlocked ? "Remove from Airlock" : "Add to Airlock"}>
                                        {airlocking ? (
                                            <Loader2 className="size-3.5 md:size-4 animate-spin" />
                                        ) : download.airlocked ? (
                                            <Lock className="size-3.5 md:size-4" />
                                        ) : (
                                            <LockOpen className="size-3.5 md:size-4" />
                                        )}
                                    </Button>
                                )}
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
