"use client";

import { useState, useMemo, memo } from "react";
import { type AddonSource } from "@/lib/addons/types";
import { useAddonSources } from "@/hooks/use-addons";
import { Button } from "@/components/ui/button";
import { Plus, Loader2, HardDriveDownloadIcon, Trash2Icon, DownloadIcon, AlertTriangle, PlayIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthGuaranteed } from "@/components/auth/auth-provider";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { useRouter } from "next/navigation";
import { CachedBadge } from "@/components/display";
import { useStreamingStore, type StreamingRequest } from "@/lib/stores/streaming";

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

export const SourceRow = memo(function SourceRow({
    source,
    request,
}: {
    source: AddonSource;
    request: StreamingRequest;
}) {
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
                            <Button size="sm" onClick={() => useStreamingStore.getState().playSource(source, request)}>
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

    // rerender-derived-state-no-effect: derive addon list + filtered sources from data
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

    return (
        <div className="space-y-2">
            {/* Addon filter — outside card, no background */}
            {addonNames.length > 1 && (
                <div className="flex justify-end pt-2">
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
                </div>
            )}

            <div className={cn("border border-border/50 rounded-sm overflow-hidden", className)}>
                {/* Loading indicator */}
                {isLoading && (
                    <div className="flex items-center justify-center gap-2 px-4 py-3 border-b border-border/50 bg-muted/20">
                        <Loader2 className="size-4.5 animate-spin text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Loading sources...</span>
                    </div>
                )}

                {!isLoading && filtered?.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                        <p className="text-sm text-muted-foreground">No sources available</p>
                        <p className="text-xs text-muted-foreground/70 mt-1">Configure addons to fetch sources</p>
                    </div>
                )}

                {filtered?.map((source, index) => (
                    <SourceRow key={`${source.addonId}-${source.url || index}`} source={source} request={request} />
                ))}

                {/* Failed addons warning */}
                {!isLoading && failedAddons.length > 0 && (
                    <div className="flex items-center justify-center gap-2 px-4 py-3 bg-yellow-500/10 border-t border-border/50">
                        <AlertTriangle className="size-4.5 text-yellow-600" />
                        <span className="text-xs text-yellow-600">Failed: {failedAddons.join(", ")}</span>
                    </div>
                )}
            </div>
        </div>
    );
}
