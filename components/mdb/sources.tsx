"use client";

import { useState } from "react";
import { type AddonSource, type TvSearchParams } from "@/lib/addons/types";
import { useAddonSources } from "@/hooks/use-addon";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Plus,
    Loader2,
    HardDriveDownloadIcon,
    Trash2Icon,
    DownloadIcon,
    Zap,
    X,
    AlertTriangle,
    HardDrive,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthContext } from "@/lib/contexts/auth";
import { toast } from "sonner";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "../ui/dialog";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";

interface SourcesProps {
    imdbId: string;
    mediaType?: "movie" | "show";
    tvParams?: TvSearchParams;
    className?: string;
}

interface SourcesDialogProps extends SourcesProps {
    children: React.ReactNode;
}

interface SourcesSkeletonProps {
    count?: number;
    className?: string;
}

export function AddSourceButton({ magnet }: { magnet: string }) {
    const { client } = useAuthContext();
    const router = useRouter();
    const [status, setStatus] = useState<"added" | "cached" | "loading" | null>(null);
    const [torrentId, setTorrentId] = useState<number | string | null>(null);

    const handleAdd = async () => {
        setStatus("loading");
        try {
            const result = await client.addTorrent([magnet]);
            const sourceStatus = result[magnet];
            if (sourceStatus.error) {
                throw new Error(sourceStatus.error);
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
            <div className="flex items-center gap-1.5 justify-end">
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => handleRemove()}>
                    <Trash2Icon className="h-4 w-4" />
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 sm:w-auto gap-0 sm:gap-1.5 p-0 sm:px-3"
                    onClick={() => {
                        if (torrentId) {
                            router.push(`/files?q=id:${torrentId}`);
                        }
                    }}>
                    <DownloadIcon className="h-4 w-4" />
                    <span className="hidden sm:inline">View Files</span>
                </Button>
            </div>
        );
    }

    if (status === "added") {
        return (
            <div className="flex items-center gap-1.5 justify-end">
                <div className="flex items-center justify-center h-8 w-8 sm:w-auto sm:gap-1.5 sm:px-2.5 rounded-md bg-blue-500/10 text-blue-600">
                    <HardDriveDownloadIcon className="h-4 w-4 animate-pulse" />
                    <span className="text-xs font-medium hidden sm:inline">Processing</span>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => handleRemove()}>
                    <Trash2Icon className="h-4 w-4" />
                </Button>
            </div>
        );
    }

    return (
        <Button
            size="sm"
            onClick={() => handleAdd()}
            disabled={status === "loading"}
            className="h-8 w-8 sm:w-auto gap-0 sm:gap-1.5 p-0 sm:px-3">
            {status === "loading" ? (
                <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="hidden sm:inline">Adding...</span>
                </>
            ) : (
                <>
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline">Add</span>
                </>
            )}
        </Button>
    );
}

export function SourceRow({ source, isFirst, isLast }: { source: AddonSource; isFirst?: boolean; isLast?: boolean }) {
    return (
        <div
            className={cn(
                "flex items-start gap-2 px-2 sm:px-4 md:px-5 py-2.5 border-b border-border/40 last:border-0 hover:bg-muted/30 transition-colors",
                isFirst && "pt-3 sm:pt-3.5 md:pt-4",
                isLast && "pb-3 sm:pb-3.5 md:pb-4"
            )}>
            <div className="flex-1 min-w-0">
                {/* Title */}
                <div className="font-medium text-xs sm:text-sm mb-1.5 leading-tight wrap-break-word">
                    {source.title}
                </div>

                {/* Description */}
                {source.folder && (
                    <div className="text-xs text-muted-foreground whitespace-pre-wrap wrap-break-word mb-1.5">
                        {source.folder}
                    </div>
                )}

                {/* Badges and Button Row */}
                <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                            {/* Cached Badge */}
                            {source.isCached && (
                                <Badge
                                    variant="secondary"
                                    className="text-xs px-1.5 py-0.5 h-5 bg-green-500/10 text-green-600 hover:bg-green-500/20 border-green-500/20">
                                    <Zap className="h-2.5 w-2.5 mr-0.5" />
                                    <span>Cached</span>
                                </Badge>
                            )}

                            {/* Size Badge */}
                            {source.size && (
                                <Badge
                                    variant="outline"
                                    className="text-xs px-1.5 py-0.5 h-5 bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 border-blue-500/20"
                                    title="Size">
                                    <HardDrive className="h-2.5 w-2.5 mr-0.5" />
                                    {source.size}
                                </Badge>
                            )}

                            {/* Addon Badge */}
                            <Badge variant="outline" className="text-xs px-1.5 py-0.5 h-5">
                                {source.addonName}
                            </Badge>
                        </div>
                    </div>

                    <div className="shrink-0">{source.magnet && <AddSourceButton magnet={source.magnet} />}</div>
                </div>
            </div>
        </div>
    );
}

export function Sources({ imdbId, mediaType = "movie", tvParams, className }: SourcesProps) {
    const { data: sources, isLoading, failedAddons } = useAddonSources({ imdbId, mediaType, tvParams });

    return (
        <div className={cn("border rounded-lg overflow-hidden bg-card", className)}>
            {/* Loading indicator */}
            {isLoading && (
                <div className="flex items-center justify-center gap-2 px-3 sm:px-4 md:px-5 py-3 border-b border-border/40 bg-muted/30">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Loading sources from addons...</span>
                </div>
            )}

            {!isLoading && sources?.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
                        <X className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="font-medium">No sources available</p>
                    <p className="text-sm text-muted-foreground mt-1">Configure addons to fetch sources</p>
                </div>
            )}

            {sources?.map((source, index) => (
                <SourceRow
                    key={`${source.addonId}-${source.url || index}`}
                    source={source}
                    isFirst={index === 0 && !isLoading}
                    isLast={index === sources.length - 1 && failedAddons.length === 0}
                />
            ))}

            {/* Failed addons warning */}
            {!isLoading && failedAddons.length > 0 && (
                <div className="flex items-center justify-center gap-2 px-3 sm:px-4 md:px-5 py-3 bg-yellow-500/10">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm text-yellow-600">Failed to load add-ons: {failedAddons.join(", ")}</span>
                </div>
            )}
        </div>
    );
}

export function SourcesSkeleton({ count = 5, className }: SourcesSkeletonProps) {
    return (
        <div className={cn("border rounded-lg overflow-hidden bg-card", className)}>
            {Array.from({ length: count }).map((_, i) => (
                <div
                    key={i}
                    className={cn(
                        "flex items-center gap-2 sm:gap-3 px-3 sm:px-4 md:px-5 py-2.5 border-b border-border/40 last:border-0",
                        i === 0 && "pt-3 sm:pt-3.5 md:pt-4",
                        i === count - 1 && "pb-3 sm:pb-3.5 md:pb-4"
                    )}>
                    <div className="flex-1">
                        <Skeleton className="h-12 w-full" />
                    </div>
                    <Skeleton className="h-8 w-16 sm:w-24" />
                </div>
            ))}
        </div>
    );
}

export function SourcesDialog({ imdbId, mediaType = "movie", tvParams, children }: SourcesDialogProps) {
    if (!imdbId) return null;

    return (
        <Dialog>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col gap-0">
                <div className="flex-none px-6 pt-6 pb-4 border-b">
                    <DialogTitle className="text-xl sm:text-2xl font-bold">
                        Available Sources
                        {tvParams && (
                            <span className="text-muted-foreground font-normal">
                                {" "}
                                - S{tvParams.season}E{tvParams.episode}
                            </span>
                        )}
                    </DialogTitle>
                    <DialogDescription className="mt-2">
                        Select a source to add to your download queue. Higher peer count indicates better availability.
                    </DialogDescription>
                </div>
                <div className="flex-1 overflow-y-auto min-h-0 px-6 py-4">
                    <Sources imdbId={imdbId} mediaType={mediaType} tvParams={tvParams} />
                </div>
                <div className="flex-none px-6 py-4 border-t bg-muted/20">
                    <DialogClose asChild>
                        <Button variant="outline" className="w-full sm:w-auto sm:ml-auto sm:flex">
                            <X className="size-4 mr-2" />
                            Close
                        </Button>
                    </DialogClose>
                </div>
            </DialogContent>
        </Dialog>
    );
}
