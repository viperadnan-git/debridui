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
    CheckCircle2Icon,
    RotateCcwIcon,
    Loader2,
    X,
    HardDriveDownloadIcon,
    Trash2Icon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthContext } from "@/lib/contexts/auth";
import { toast } from "sonner";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "../ui/dialog";

interface SourcesProps {
    imdbId?: string;
    mediaType?: "movie" | "show";
    tvParams?: TvSearchParams;
    className?: string;
    singleColumn?: boolean;
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
    const [status, setStatus] = useState<"added" | "cached" | "failed" | "loading" | null>(null);
    const [torrentId, setTorrentId] = useState<number | null>(null);

    const handleAdd = async () => {
        setStatus("loading");
        try {
            const result = await client.addTorrent([magnet]);
            const magnetStatus = result[magnet];
            if (magnetStatus.error) {
                throw new Error(magnetStatus.error);
            }
            setStatus(magnetStatus.is_cached ? "cached" : "added");
            setTorrentId(magnetStatus.id as number);
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
            <div className="flex items-center gap-1">
                <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 text-destructive/80 hover:text-destructive"
                    onClick={() => handleRemove()}>
                    <Trash2Icon className="size-4" />
                </Button>
                <CheckCircle2Icon className="size-8 text-green-500 flex-shrink-0" />
            </div>
        );
    }

    if (status === "added") {
        return (
            <div className="flex items-center gap-1">
                <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 text-destructive/80 hover:text-destructive"
                    onClick={() => handleRemove()}>
                    <Trash2Icon className="size-4" />
                </Button>
                <HardDriveDownloadIcon className="size-8 text-blue-500 flex-shrink-0 animate-pulse" />
            </div>
        );
    }

    return (
        <Button
            size="icon"
            onClick={() => handleAdd()}
            disabled={status === "loading"}
            className={cn("text-xs gap-0.5", status === "failed" && "bg-yellow-400 hover:bg-yellow-500")}>
            {status === "failed" ? (
                <RotateCcwIcon className="size-4" />
            ) : status === "loading" ? (
                <Loader2 className="size-4 animate-spin" />
            ) : (
                <Plus className="size-4" />
            )}
        </Button>
    );
}

export function SourceCard({ source }: { source: TorrentioSource }) {
    return (
        <Card key={source.hash} className="overflow-hidden">
            <CardContent className="h-full">
                <div className="flex items-start justify-between gap-2 h-full w-full">
                    <div className="min-w-0 flex flex-col gap-1 h-full w-full">
                        <p className="text-xs sm:text-sm font-medium leading-tight break-words">{source.title}</p>

                        {source.folder && (
                            <div className="flex items-center gap-1">
                                <span className="text-xs sm:text-sm text-muted-foreground font-mono leading-tight break-words line-clamp-3">
                                    {source.folder}
                                </span>
                            </div>
                        )}

                        <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3 mt-auto w-full">
                            <div className="flex items-center gap-0.5">
                                <HardDrive className="size-3 md:size-4 text-muted-foreground flex-shrink-0" />
                                <span className="text-xs sm:text-sm text-muted-foreground">{source.size}</span>
                            </div>

                            {source.peers && (
                                <div className="flex items-center gap-0.5">
                                    <Users className="size-3 md:size-4 text-muted-foreground flex-shrink-0" />
                                    <span className="text-xs sm:text-sm text-muted-foreground">{source.peers}</span>
                                </div>
                            )}

                            <div className="ms-auto flex-shrink-0">
                                <AddHashButton magnet={source.magnet} />
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

export function Sources({ imdbId, mediaType = "movie", tvParams, className, singleColumn = false }: SourcesProps) {
    const { data: sources, isLoading, error } = useTorrentioSources(imdbId, mediaType, tvParams);

    if (error) {
        return (
            <Card className={cn("border-destructive", className)}>
                <CardContent className="pt-6">
                    <div className="flex items-center gap-2 text-destructive">
                        <AlertCircle className="h-4 w-4" />
                        <p className="text-sm">Failed to load sources: {error.message}</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (isLoading) {
        return (
            <div className={cn("space-y-1", className)}>
                {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 sm:h-14 w-full" />
                ))}
            </div>
        );
    }

    if (!sources || sources.length === 0) {
        return (
            <Card className={className}>
                <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground text-center">No sources available</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div
            className={cn(
                singleColumn
                    ? "grid grid-cols-1 gap-2"
                    : "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2",
                className
            )}>
            {sources.map((source) => (
                <SourceCard key={source.hash} source={source} />
            ))}
        </div>
    );
}

export function SourcesSkeleton({ count = 3, className }: SourcesSkeletonProps) {
    return (
        <div className={cn("space-y-1", className)}>
            {Array.from({ length: count }).map((_, i) => (
                <Skeleton key={i} className="h-12 sm:h-14 w-full" />
            ))}
        </div>
    );
}

export function SourcesDialog({ imdbId, mediaType = "movie", tvParams, children }: SourcesDialogProps) {
    return (
        <Dialog>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
                <div className="flex-none">
                    <DialogTitle>
                        Available Sources
                        {tvParams && ` - Season ${tvParams.season} Episode ${tvParams.episode}`}
                    </DialogTitle>
                    <DialogDescription>
                        Sources are the locations where the media can be downloaded from. You can add them to your queue
                        by clicking the + button.
                    </DialogDescription>
                </div>
                <div className="flex-1 overflow-y-auto min-h-0 mt-4">
                    <Sources
                        imdbId={imdbId}
                        mediaType={mediaType}
                        tvParams={tvParams}
                        className="pb-2"
                        singleColumn={true}
                    />
                </div>
                <div className="pt-4 border-t flex justify-end">
                    <DialogClose asChild>
                        <Button variant="outline" className="w-full sm:w-auto">
                            <X className="size-4" />
                            Close
                        </Button>
                    </DialogClose>
                </div>
            </DialogContent>
        </Dialog>
    );
}
