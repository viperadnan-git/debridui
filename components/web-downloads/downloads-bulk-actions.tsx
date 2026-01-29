"use client";

import { useState, useEffect, useMemo } from "react";
import { WebDownload } from "@/lib/types";
import { useWebDownloads } from "./web-downloads-provider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Copy, Trash2, X, Loader2, Download } from "lucide-react";
import { toast } from "sonner";

interface DownloadsBulkActionsProps {
    selectedDownloads: WebDownload[];
    onClearSelection: () => void;
}

export function DownloadsBulkActions({ selectedDownloads, onClearSelection }: DownloadsBulkActionsProps) {
    const { deleteDownload, getDownloadLink } = useWebDownloads();
    const [isVisible, setIsVisible] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);
    const [loading, setLoading] = useState<"copy" | "delete" | "download" | null>(null);

    const hasSelection = selectedDownloads.length > 0;

    // Filter to ready downloads only
    const readyDownloads = useMemo(
        () => selectedDownloads.filter((d) => d.status === "completed" || d.status === "cached"),
        [selectedDownloads]
    );

    // Handle visibility with animation
    useEffect(() => {
        let timeout: NodeJS.Timeout;
        if (hasSelection) {
            setIsVisible(true);
            timeout = setTimeout(() => setIsAnimating(true), 10);
        } else {
            setIsAnimating(false);
            timeout = setTimeout(() => setIsVisible(false), 300);
        }
        return () => clearTimeout(timeout);
    }, [hasSelection]);

    const handleCopyLinks = async () => {
        if (readyDownloads.length === 0) {
            toast.error("No ready downloads selected");
            return;
        }

        setLoading("copy");
        try {
            const links: string[] = [];
            for (const download of readyDownloads) {
                try {
                    const link = await getDownloadLink(download);
                    links.push(link);
                } catch {
                    // Skip failed links
                }
            }

            if (links.length > 0) {
                await navigator.clipboard.writeText(links.join("\n"));
                toast.success(`Copied ${links.length} link${links.length !== 1 ? "s" : ""} to clipboard`);
            } else {
                toast.error("Failed to get any links");
            }
        } finally {
            setLoading(null);
        }
    };

    const handleDownloadAll = async () => {
        if (readyDownloads.length === 0) {
            toast.error("No ready downloads selected");
            return;
        }

        setLoading("download");
        try {
            let count = 0;
            for (const download of readyDownloads) {
                try {
                    const link = await getDownloadLink(download);
                    const a = document.createElement("a");
                    a.href = link;
                    a.download = download.name;
                    a.target = "_blank";
                    a.click();
                    count++;
                    // Small delay between downloads to prevent browser blocking
                    if (count < readyDownloads.length) {
                        await new Promise((r) => setTimeout(r, 200));
                    }
                } catch {
                    // Skip failed
                }
            }

            if (count > 0) {
                toast.success(`Started ${count} download${count !== 1 ? "s" : ""}`);
            }
        } finally {
            setLoading(null);
        }
    };

    const handleDeleteAll = async () => {
        setLoading("delete");
        try {
            let deleted = 0;
            for (const download of selectedDownloads) {
                try {
                    await deleteDownload(download.id);
                    deleted++;
                } catch {
                    // Continue on error
                }
            }

            if (deleted > 0) {
                toast.success(`Removed ${deleted} download${deleted !== 1 ? "s" : ""}`);
                onClearSelection();
            } else {
                toast.error("Failed to remove downloads");
            }
        } finally {
            setLoading(null);
        }
    };

    if (!isVisible) return null;

    const isDisabled = loading !== null;

    return (
        <>
            {/* Spacer */}
            <div className={cn("transition-all duration-300 ease-in-out", isAnimating ? "h-20" : "h-0")} />

            {/* Drawer */}
            <div
                className={cn(
                    "fixed bottom-0 left-0 right-0 z-40 bg-background border-t border-border shadow-lg transition-transform duration-300 ease-in-out",
                    isAnimating ? "translate-y-0" : "translate-y-full"
                )}>
                <div className="container mx-auto max-w-4xl">
                    <div className="flex flex-col items-center gap-3 p-4">
                        {/* Selection info */}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="font-medium text-foreground">{selectedDownloads.length}</span>
                            <span>selected</span>
                            {readyDownloads.length !== selectedDownloads.length && (
                                <>
                                    <span className="text-border">·</span>
                                    <span>{readyDownloads.length} ready</span>
                                </>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 flex-wrap justify-center">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleCopyLinks}
                                disabled={isDisabled || readyDownloads.length === 0}
                                className="text-xs sm:text-sm">
                                {loading === "copy" ? (
                                    <Loader2 className="size-4 animate-spin" />
                                ) : (
                                    <Copy className="size-4" />
                                )}
                                Copy Links
                            </Button>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleDownloadAll}
                                disabled={isDisabled || readyDownloads.length === 0}
                                className="text-xs sm:text-sm">
                                {loading === "download" ? (
                                    <Loader2 className="size-4 animate-spin" />
                                ) : (
                                    <Download className="size-4" />
                                )}
                                Download
                            </Button>

                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={handleDeleteAll}
                                disabled={isDisabled}
                                className="text-xs sm:text-sm">
                                {loading === "delete" ? (
                                    <Loader2 className="size-4 animate-spin" />
                                ) : (
                                    <Trash2 className="size-4" />
                                )}
                                Remove
                            </Button>

                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={onClearSelection}
                                disabled={isDisabled}
                                className="text-xs sm:text-sm text-muted-foreground">
                                <X className="size-4" />
                                Clear
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
