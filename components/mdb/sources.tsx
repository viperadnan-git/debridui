"use client";

import {
    AlertTriangle,
    DownloadIcon,
    HardDriveDownloadIcon,
    LayersIcon,
    Loader2,
    PlayIcon,
    Plus,
    Trash2Icon,
    Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { memo, useMemo, useState } from "react";
import { toast } from "sonner";
import { useAuthGuaranteed } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { useAddonSources } from "@/hooks/use-addons";
import type { AddonSource } from "@/lib/addons/types";
import { type StreamingRequest, useStreamingStore } from "@/lib/stores/streaming";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

interface SourcesProps {
    request: StreamingRequest;
    className?: string;
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

    const compact = "h-7 sm:h-8 px-2.5 sm:px-3 text-xs gap-1.5 [&_svg]:size-3.5";
    const compactIcon = "size-7 sm:size-8 [&_svg]:size-3.5";

    if (status === "cached") {
        return (
            <div className="flex items-center gap-1.5">
                <Button
                    variant="outline"
                    size="sm"
                    className={compact}
                    onClick={() => {
                        if (torrentId) {
                            router.push(`/files?q=id:${torrentId}`);
                        }
                    }}>
                    <DownloadIcon />
                    View
                </Button>
                <Button
                    variant="ghost"
                    size="icon-sm"
                    className={cn(compactIcon, "group/delete hover:bg-destructive/10!")}
                    onClick={() => handleRemove()}>
                    <Trash2Icon className="text-destructive/70 group-hover/delete:text-destructive" />
                </Button>
            </div>
        );
    }

    if (status === "added") {
        return (
            <div className="flex items-center gap-1.5">
                <div className="flex items-center h-7 sm:h-8 gap-1.5 px-2.5 rounded-sm bg-primary/10 text-primary">
                    <HardDriveDownloadIcon className="size-3.5 animate-pulse" />
                    <span className="text-xs">Processing</span>
                </div>
                <Button
                    variant="ghost"
                    size="icon-sm"
                    className={cn(compactIcon, "group/delete hover:bg-destructive/10!")}
                    onClick={() => handleRemove()}>
                    <Trash2Icon className="text-destructive/70 group-hover/delete:text-destructive" />
                </Button>
            </div>
        );
    }

    return (
        <Button
            variant="outline"
            size="sm"
            className={compact}
            onClick={() => handleAdd()}
            disabled={status === "loading"}>
            {status === "loading" ? (
                <>
                    <Loader2 className="animate-spin" />
                    Adding
                </>
            ) : (
                <>
                    <Plus />
                    Add
                </>
            )}
        </Button>
    );
}

function resolutionTier(res?: string): "uhd" | "fhd" | "hd" | "sd" {
    const r = (res || "").toLowerCase();
    if (r.includes("2160") || r.includes("4k") || r.includes("uhd")) return "uhd";
    if (r.includes("1080")) return "fhd";
    if (r.includes("720")) return "hd";
    return "sd";
}

export const SourceRow = memo(function SourceRow({
    source,
    request,
}: {
    source: AddonSource;
    request: StreamingRequest;
}) {
    const tier = resolutionTier(source.resolution);
    const resolutionLabel = source.resolution || "SD";
    const resolutionTone = tier === "uhd" ? "text-primary" : "text-foreground";

    return (
        <div className="group/source flex flex-col gap-2 px-3 sm:px-4 lg:px-5 py-3 sm:py-3.5 transition-colors border-b border-border/40 last:border-0 hover:bg-muted/20">
            {/* Status line — cached · resolution · quality · size */}
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs tracking-wider uppercase">
                {source.isCached && (
                    <>
                        <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-500">
                            <Zap className="size-3 fill-current -translate-y-px" />
                            <span className="hidden sm:inline">Cached</span>
                        </span>
                        <span className="text-border">·</span>
                    </>
                )}
                <span className={cn("font-medium tabular-nums", resolutionTone)}>{resolutionLabel}</span>
                {source.quality && (
                    <>
                        <span className="text-border">·</span>
                        <span className="text-foreground/80">{source.quality}</span>
                    </>
                )}
                {source.size && (
                    <>
                        <span className="text-border">·</span>
                        <span className="text-foreground/80 tabular-nums tracking-normal normal-case">
                            {source.size}
                        </span>
                    </>
                )}
            </div>

            {/* Title */}
            <div className="text-sm leading-snug wrap-break-word">{source.title}</div>

            {/* Description */}
            {source.description && (
                <p className="text-xs text-muted-foreground whitespace-pre-wrap wrap-break-word leading-relaxed">
                    {source.description}
                </p>
            )}

            {/* Controls row — addon kicker (left) + actions (right) */}
            <div className="flex items-center justify-between gap-3 flex-wrap pt-0.5">
                <div className="text-xs tracking-wider uppercase text-muted-foreground/70">{source.addonName}</div>
                {(source.url || source.magnet) && (
                    <div className="flex items-center gap-1.5 sm:gap-2 ml-auto">
                        {source.magnet && <AddSourceButton magnet={source.magnet} />}
                        {source.url && (
                            <Button
                                size="sm"
                                className="h-7 sm:h-8 px-2.5 sm:px-3 text-xs gap-1.5 [&_svg]:size-3.5"
                                onClick={() => useStreamingStore.getState().playSource(source, request)}>
                                <PlayIcon className="fill-current" />
                                Play
                            </Button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
});

function SourceRowSkeleton() {
    return (
        <div className="flex items-stretch gap-3 sm:gap-4 px-3 sm:px-4 py-3 border-b border-border/40 last:border-0">
            <div className="flex-1 space-y-2 py-0.5">
                <div className="h-2.5 bg-muted/30 rounded-sm w-1/3 animate-pulse" />
                <div className="h-3.5 bg-muted/40 rounded-sm w-4/5 animate-pulse" />
                <div className="h-2.5 bg-muted/30 rounded-sm w-1/4 animate-pulse" />
            </div>
            <div className="hidden sm:block w-24 h-8 bg-muted/30 rounded-sm animate-pulse self-center" />
        </div>
    );
}

export function Sources({ request, className }: SourcesProps) {
    const {
        data: sources,
        isLoading,
        failedAddons,
    } = useAddonSources({
        imdbId: request.imdbId,
        mediaType: request.type,
        tvParams: request.tvParams,
    });

    const [addonFilter, setAddonFilter] = useState("all");

    const addonNames = useMemo(() => {
        if (!sources?.length) return [];
        const seen = new Map<string, string>();
        for (const s of sources) {
            if (!seen.has(s.addonId)) seen.set(s.addonId, s.addonName);
        }
        return Array.from(seen, ([id, name]) => ({ id, name }));
    }, [sources]);

    const filtered = useMemo(
        () => (addonFilter === "all" ? sources : sources?.filter((s) => s.addonId === addonFilter)),
        [sources, addonFilter]
    );

    const cachedCount = useMemo(() => filtered?.filter((s) => s.isCached).length ?? 0, [filtered]);
    const total = filtered?.length ?? 0;

    return (
        <div className="space-y-2">
            {/* Editorial header — count summary + addon filter */}
            <div className="flex items-center justify-between gap-3 px-3 sm:px-4 lg:px-5 pt-2">
                <div className="inline-flex items-center gap-2 sm:gap-3 text-[11px] sm:text-xs lg:text-xs tracking-[0.2em] sm:tracking-[0.25em] uppercase text-muted-foreground/80">
                    {isLoading ? (
                        <span className="inline-flex items-center gap-1.5">
                            <Loader2 className="size-3 animate-spin" />
                            <span className="hidden sm:inline">Loading sources</span>
                        </span>
                    ) : total > 0 ? (
                        <>
                            <span className="inline-flex items-center gap-1.5">
                                <LayersIcon className="size-3 text-muted-foreground/70 sm:hidden" />
                                <span className="tabular-nums text-foreground/80">
                                    {String(total).padStart(2, "0")}
                                </span>
                                <span className="hidden sm:inline">Sources</span>
                            </span>
                            {cachedCount > 0 && (
                                <>
                                    <span className="text-border hidden sm:inline">·</span>
                                    <span className="inline-flex items-center gap-1.5 text-green-600 dark:text-green-500">
                                        <Zap className="size-3 fill-current -translate-y-px sm:hidden" />
                                        <span className="tabular-nums">{String(cachedCount).padStart(2, "0")}</span>
                                        <span className="hidden sm:inline">Cached</span>
                                    </span>
                                </>
                            )}
                        </>
                    ) : (
                        "No Sources"
                    )}
                </div>
                {addonNames.length > 1 && (
                    <Select value={addonFilter} onValueChange={setAddonFilter}>
                        <SelectTrigger size="sm" className="w-32 sm:w-40 text-xs sm:text-sm">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All addons</SelectItem>
                            {addonNames.map((a) => (
                                <SelectItem key={a.id} value={a.id}>
                                    {a.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}
            </div>

            <div className={cn("border border-border/40 rounded-sm overflow-hidden", className)}>
                {/* Results first */}
                {filtered?.map((source, index) => (
                    <SourceRow key={`${source.addonId}-${source.url || index}`} source={source} request={request} />
                ))}

                {/* Skeleton rows at the bottom while any addon is still fetching */}
                {isLoading && (
                    <>
                        <SourceRowSkeleton />
                        <SourceRowSkeleton />
                        <SourceRowSkeleton />
                    </>
                )}

                {!isLoading && filtered?.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                        <p className="text-sm font-light text-foreground/80">No sources available</p>
                        <p className="text-xs text-muted-foreground/70 mt-1.5">
                            Configure stream-capable addons in settings
                        </p>
                    </div>
                )}

                {!isLoading && failedAddons.length > 0 && (
                    <div className="flex items-center justify-center gap-2 px-4 py-2.5 bg-destructive/[0.04] border-t border-destructive/20">
                        <AlertTriangle className="size-3.5 text-destructive/70" />
                        <span className="text-[11px] tracking-wide text-destructive/80">
                            <span className="tracking-[0.2em] uppercase text-[10px] mr-2">Unreachable</span>
                            {failedAddons.join(", ")}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}
