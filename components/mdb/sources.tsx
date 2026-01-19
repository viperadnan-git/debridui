"use client";

import { useState } from "react";
import { TorrentioSource, type TvSearchParams } from "@/lib/torrentio";
import { useTorrentioSources } from "@/hooks/use-torrentio";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Plus,
    HardDrive,
    AlertCircle,
    Users,
    RotateCcwIcon,
    Loader2,
    X,
    HardDriveDownloadIcon,
    Trash2Icon,
    DownloadIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthContext } from "@/lib/contexts/auth";
import { toast } from "sonner";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "../ui/dialog";
import { useRouter } from "next/navigation";

interface SourcesProps {
    imdbId?: string;
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

function AddHashButton({ magnet }: { magnet: string }) {
    const { client } = useAuthContext();
    const router = useRouter();
    const [status, setStatus] = useState<"added" | "cached" | "failed" | "loading" | null>(null);
    const [torrentId, setTorrentId] = useState<number | string | null>(null);

    const handleAdd = async () => {
        setStatus("loading");
        try {
            const result = await client.addTorrent([magnet]);
            const magnetStatus = result[magnet];
            if (magnetStatus.error) {
                throw new Error(magnetStatus.error);
            }
            setStatus(magnetStatus.is_cached ? "cached" : "added");
            setTorrentId(magnetStatus.id as number | string);
        } catch (error) {
            toast.error(`Failed to add magnet: ${error instanceof Error ? error.message : "Unknown error"}`);
            setStatus("failed");
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
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1.5"
                    onClick={() => {
                        if (torrentId) {
                            router.push(`/files?q=id:${torrentId}`);
                        }
                    }}>
                    <DownloadIcon className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">View Files</span>
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => handleRemove()}>
                    <Trash2Icon className="h-3.5 w-3.5" />
                </Button>
            </div>
        );
    }

    if (status === "added") {
        return (
            <div className="flex items-center gap-1.5 justify-end">
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-blue-500/10 text-blue-600">
                    <HardDriveDownloadIcon className="h-4 w-4 animate-pulse" />
                    <span className="text-xs font-medium hidden sm:inline">Processing</span>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => handleRemove()}>
                    <Trash2Icon className="h-3.5 w-3.5" />
                </Button>
            </div>
        );
    }

    return (
        <Button
            size="sm"
            onClick={() => handleAdd()}
            disabled={status === "loading"}
            className={cn("h-8 gap-1.5", status === "failed" && "bg-yellow-500 hover:bg-yellow-600 text-white")}>
            {status === "failed" ? (
                <>
                    <RotateCcwIcon className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Retry</span>
                </>
            ) : status === "loading" ? (
                <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span className="hidden sm:inline">Adding...</span>
                </>
            ) : (
                <>
                    <Plus className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Add</span>
                </>
            )}
        </Button>
    );
}

export function SourceRow({
    source,
    isFirst,
    isLast,
}: {
    source: TorrentioSource;
    isFirst?: boolean;
    isLast?: boolean;
}) {
    return (
        <div
            key={source.hash}
            className={cn(
                "flex items-center gap-2 sm:gap-3 px-3 sm:px-4 md:px-5 py-2.5 border-b border-border/40 last:border-0 hover:bg-muted/30 transition-colors",
                isFirst && "pt-3 sm:pt-3.5 md:pt-4",
                isLast && "pb-3 sm:pb-3.5 md:pb-4"
            )}>
            <div className="flex-1 min-w-0 flex flex-col gap-1">
                {/* Title */}
                <div className="text-sm font-medium wrap-break-word leading-tight">{source.title}</div>

                {/* Metadata Row - All inline */}
                <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                        <HardDrive className="size-3" />
                        <span>{source.size}</span>
                    </div>

                    {source.peers && (
                        <>
                            <span>•</span>
                            <div className="flex items-center gap-1">
                                <Users className="size-3" />
                                <span>{source.peers}</span>
                            </div>
                        </>
                    )}

                    {source.folder && (
                        <>
                            <span>•</span>
                            <span className="font-mono break-all">{source.folder}</span>
                        </>
                    )}
                </div>
            </div>

            <div className="shrink-0">
                <AddHashButton magnet={source.magnet} />
            </div>
        </div>
    );
}

export function Sources({ imdbId, mediaType = "movie", tvParams, className }: SourcesProps) {
    const { data: sources, isLoading, error, refetch } = useTorrentioSources(imdbId, mediaType, tvParams);

    if (error) {
        return (
            <Card className={cn("border-destructive/50 bg-destructive/5", className)}>
                <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/10">
                            <AlertCircle className="h-5 w-5 text-destructive" />
                        </div>
                        <div className="flex-1">
                            <p className="font-semibold text-sm sm:text-base">Failed to load sources</p>
                            <p className="text-xs sm:text-sm text-muted-foreground mt-1">{error.message}</p>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => refetch()} className="gap-1.5 shrink-0">
                            <RotateCcwIcon className="h-3.5 w-3.5" />
                            <span>Retry</span>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (isLoading) {
        return (
            <div className={cn("border rounded-lg overflow-hidden bg-card", className)}>
                {Array.from({ length: 5 }).map((_, i) => (
                    <div
                        key={i}
                        className={cn(
                            "flex items-center gap-2 sm:gap-3 px-3 sm:px-4 md:px-5 py-2.5 border-b border-border/40 last:border-0",
                            i === 0 && "pt-3 sm:pt-3.5 md:pt-4",
                            i === 4 && "pb-3 sm:pb-3.5 md:pb-4"
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

    if (!sources || sources.length === 0) {
        return (
            <Card className={className}>
                <CardContent className="p-6 sm:p-8">
                    <div className="flex flex-col items-center justify-center text-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                            <AlertCircle className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <div>
                            <p className="font-medium">No sources available</p>
                            <p className="text-sm text-muted-foreground mt-1">
                                We couldn&apos;t find any sources for this content
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className={cn("border rounded-lg overflow-hidden bg-card", className)}>
            {sources.map((source, index) => (
                <SourceRow
                    key={source.hash}
                    source={source}
                    isFirst={index === 0}
                    isLast={index === sources.length - 1}
                />
            ))}
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
