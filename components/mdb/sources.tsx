"use client";

import { useState, memo } from "react";
import { type AddonSource, type TvSearchParams } from "@/lib/addons/types";
import { useAddonSources } from "@/hooks/use-addons";
import { Button } from "@/components/ui/button";
import { Plus, Loader2, HardDriveDownloadIcon, Trash2Icon, DownloadIcon, AlertTriangle, PlayIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthGuaranteed } from "@/components/auth/auth-provider";
import { toast } from "sonner";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "../ui/dialog";
import { useRouter } from "next/navigation";
import { CachedBadge } from "@/components/display";
import { useStreamingStore } from "@/lib/stores/streaming";

interface SourcesProps {
    imdbId: string;
    mediaType?: "movie" | "show";
    tvParams?: TvSearchParams;
    className?: string;
    mediaTitle: string;
}

interface SourcesDialogProps extends SourcesProps {
    children: React.ReactNode;
}

export function AddSourceButton({ magnet }: { magnet: string }) {
    const { client } = useAuthGuaranteed();
    const router = useRouter();
    const [status, setStatus] = useState<"added" | "cached" | "loading" | null>(null);
    const [torrentId, setTorrentId] = useState<number | string | null>(null);

    const handleAdd = async () => {
        setStatus("loading");
        try {
            const result = await client.addTorrent([magnet]);
            const sourceStatus = result[magnet];
            if (!sourceStatus.success) {
                throw new Error(sourceStatus.message);
            }
            setStatus(sourceStatus.is_cached ? "cached" : "added");
            setTorrentId(sourceStatus.id as number | string);
        } catch (error) {
            toast.error(`Failed to add source: ${error instanceof Error ? error.message : "Unknown error"}`);
            setStatus(null);
        }
    };

    const handleRemove = async () => {
        if (!torrentId) return;
        await client.removeTorrent(torrentId.toString());
        setStatus(null);
    };

    if (status === "cached") {
        return (
            <div className="flex items-center gap-1.5">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                        if (torrentId) {
                            router.push(`/files?q=id:${torrentId}`);
                        }
                    }}>
                    <DownloadIcon className="size-4" />
                    View
                </Button>
                <Button
                    variant="ghost"
                    size="icon-sm"
                    className="group/delete hover:!bg-destructive/10"
                    onClick={() => handleRemove()}>
                    <Trash2Icon className="size-4 text-destructive/70 group-hover/delete:text-destructive" />
                </Button>
            </div>
        );
    }

    if (status === "added") {
        return (
            <div className="flex items-center gap-1.5">
                <div className="flex items-center h-8 gap-1.5 px-2.5 rounded-sm bg-primary/10 text-primary">
                    <HardDriveDownloadIcon className="size-4 animate-pulse" />
                    <span className="text-xs">Processing</span>
                </div>
                <Button
                    variant="ghost"
                    size="icon-sm"
                    className="group/delete hover:!bg-destructive/10"
                    onClick={() => handleRemove()}>
                    <Trash2Icon className="size-4 text-destructive/70 group-hover/delete:text-destructive" />
                </Button>
            </div>
        );
    }

    return (
        <Button variant="outline" size="sm" onClick={() => handleAdd()} disabled={status === "loading"}>
            {status === "loading" ? (
                <>
                    <Loader2 className="size-4 animate-spin" />
                    Adding
                </>
            ) : (
                <>
                    <Plus className="size-4" />
                    Add
                </>
            )}
        </Button>
    );
}

export const SourceRow = memo(function SourceRow({ source, mediaTitle }: { source: AddonSource; mediaTitle: string }) {
    // Build metadata string with editorial separators
    const metaParts: string[] = [];
    if (source.resolution) metaParts.push(source.resolution);
    if (source.quality) metaParts.push(source.quality);
    if (source.size) metaParts.push(source.size);
    metaParts.push(source.addonName);

    return (
        <div className="flex flex-col gap-2 px-4 py-3 border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors">
            {/* Title */}
            <div className="text-sm leading-tight break-words">{source.title}</div>

            {/* Description */}
            {source.description && (
                <div className="text-xs text-muted-foreground whitespace-pre-wrap break-words">
                    {source.description}
                </div>
            )}

            {/* Metadata & Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                {/* Metadata with editorial separators */}
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 sm:flex-1 text-xs text-muted-foreground">
                    {source.isCached && (
                        <>
                            <CachedBadge />
                            <span className="text-border">·</span>
                        </>
                    )}
                    {metaParts.map((part, i) => (
                        <span key={part} className="flex items-center">
                            {part}
                            {i < metaParts.length - 1 && <span className="text-border ml-2">·</span>}
                        </span>
                    ))}
                </div>

                {/* Action Buttons */}
                {(source.url || source.magnet) && (
                    <div className="flex items-center gap-2 justify-end sm:shrink-0">
                        {source.magnet && <AddSourceButton magnet={source.magnet} />}
                        {source.url && (
                            <Button
                                size="sm"
                                onClick={() => useStreamingStore.getState().playSource(source, mediaTitle)}>
                                <PlayIcon className="size-4 fill-current" />
                                Play
                            </Button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
});

export function Sources({ imdbId, mediaType = "movie", tvParams, className, mediaTitle }: SourcesProps) {
    const { data: sources, isLoading, failedAddons } = useAddonSources({ imdbId, mediaType, tvParams });

    return (
        <div className={cn("border border-border/50 rounded-sm overflow-hidden", className)}>
            {/* Loading indicator */}
            {isLoading && (
                <div className="flex items-center justify-center gap-2 px-4 py-3 border-b border-border/50 bg-muted/20">
                    <Loader2 className="size-4.5 animate-spin text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Loading sources...</span>
                </div>
            )}

            {!isLoading && sources?.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                    <p className="text-sm text-muted-foreground">No sources available</p>
                    <p className="text-xs text-muted-foreground/70 mt-1">Configure addons to fetch sources</p>
                </div>
            )}

            {sources?.map((source, index) => (
                <SourceRow key={`${source.addonId}-${source.url || index}`} source={source} mediaTitle={mediaTitle} />
            ))}

            {/* Failed addons warning */}
            {!isLoading && failedAddons.length > 0 && (
                <div className="flex items-center justify-center gap-2 px-4 py-3 bg-yellow-500/10 border-t border-border/50">
                    <AlertTriangle className="size-4.5 text-yellow-600" />
                    <span className="text-xs text-yellow-600">Failed: {failedAddons.join(", ")}</span>
                </div>
            )}
        </div>
    );
}

export function SourcesDialog({ imdbId, mediaType = "movie", tvParams, mediaTitle, children }: SourcesDialogProps) {
    if (!imdbId) return null;

    return (
        <Dialog>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col gap-0">
                <div className="flex-none px-6 pt-6 pb-4 border-b border-border/50">
                    <DialogTitle>
                        Sources
                        {tvParams && (
                            <span className="text-muted-foreground">
                                {" "}
                                · S{String(tvParams.season).padStart(2, "0")}E
                                {String(tvParams.episode).padStart(2, "0")}
                            </span>
                        )}
                    </DialogTitle>
                    <DialogDescription className="mt-2 text-xs text-muted-foreground">
                        Select a source to add to your download queue
                    </DialogDescription>
                </div>
                <div className="flex-1 overflow-y-auto min-h-0 px-6 py-4">
                    <Sources
                        imdbId={imdbId}
                        mediaType={mediaType}
                        tvParams={tvParams}
                        mediaTitle={mediaTitle}
                        className="border-0"
                    />
                </div>
                <div className="flex-none px-6 py-4 border-t border-border/50 bg-muted/20">
                    <DialogClose asChild>
                        <Button variant="outline" className="w-full sm:w-auto sm:ml-auto sm:flex">
                            Close
                        </Button>
                    </DialogClose>
                </div>
            </DialogContent>
        </Dialog>
    );
}
