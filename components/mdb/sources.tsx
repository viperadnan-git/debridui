"use client";

import {
    AlertTriangle,
    CheckIcon,
    FolderOpenIcon,
    HardDriveDownloadIcon,
    LayersIcon,
    ListIcon,
    Loader2,
    PlayIcon,
    Plus,
    Trash2Icon,
    Wand2,
    Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { memo, type ReactNode, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useAuthGuaranteed } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useAddonSources } from "@/hooks/use-addons";
import { getSourceQualityIndex } from "@/lib/addons/parser";
import type { AddonSource } from "@/lib/addons/types";
import { useSettingsStore } from "@/lib/stores/settings";
import { type StreamingRequest, useStreamingStore } from "@/lib/stores/streaming";
import { selectBestSource } from "@/lib/streaming/source-selector";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

interface SourcesProps {
    request: StreamingRequest;
    className?: string;
}

const ACTION = "h-8 px-3 gap-1.5 leading-none";
const SLOT = "h-8 min-w-24 shrink-0";

export function AddSourceButton({ magnet, url, className }: { magnet?: string; url?: string; className?: string }) {
    const { client } = useAuthGuaranteed();
    const router = useRouter();
    const [status, setStatus] = useState<"added" | "cached" | "loading" | "removing" | null>(null);
    const [torrentId, setTorrentId] = useState<number | string | null>(null);

    const handleAdd = async () => {
        setStatus("loading");
        try {
            if (!magnet) {
                // No hash to add directly — hitting the play url makes the addon resolve it into the account
                const controller = new AbortController();
                await fetch(url as string, { mode: "no-cors", signal: controller.signal });
                controller.abort(); // headers are in, drop the body
                setStatus("cached");
                return;
            }
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
        const previous = status;
        setStatus("removing");
        try {
            await client.removeTorrent(torrentId.toString());
            setStatus(null);
            setTorrentId(null);
        } catch (error) {
            toast.error(`Failed to remove source: ${error instanceof Error ? error.message : "Unknown error"}`);
            setStatus(previous);
        }
    };

    if (status && status !== "loading" && !torrentId) {
        return (
            <span
                className={cn(
                    SLOT,
                    "inline-flex items-center justify-center text-green-600 dark:text-green-500",
                    className
                )}
                title="Added to your files">
                <CheckIcon className="size-4" />
            </span>
        );
    }

    if (status === "cached" || status === "added" || status === "removing") {
        return (
            <div
                className={cn(SLOT, "flex items-center overflow-hidden rounded-sm border border-border/70", className)}>
                {status === "added" ? (
                    <span className={cn(ACTION, "inline-flex h-full items-center whitespace-nowrap text-primary")}>
                        <HardDriveDownloadIcon className="size-4 animate-pulse" />
                        Downloading
                    </span>
                ) : (
                    <Button
                        variant="ghost"
                        size="sm"
                        className={cn(ACTION, "h-full min-w-0 flex-1 rounded-none")}
                        onClick={() => router.push(`/files?q=id:${torrentId}`)}>
                        <FolderOpenIcon />
                        View
                    </Button>
                )}
                <span className="w-px self-stretch bg-border/70" />
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-full w-8 rounded-none text-destructive/70 hover:text-destructive hover:bg-destructive/10"
                    aria-label="Remove from files"
                    disabled={status === "removing"}
                    onClick={() => handleRemove()}>
                    {status === "removing" ? <Loader2 className="animate-spin" /> : <Trash2Icon />}
                </Button>
            </div>
        );
    }

    return (
        <Button
            variant="outline"
            size="sm"
            className={cn(ACTION, SLOT, className)}
            title="Add to your files"
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

export type Tier = "uhd" | "fhd" | "hd" | "other";

export function resolutionTier(res?: string): Tier {
    const r = (res || "").toLowerCase();
    if (r.includes("2160") || r.includes("4320") || r.includes("4k") || r.includes("8k") || r.includes("uhd"))
        return "uhd";
    if (r.includes("1080")) return "fhd";
    if (r.includes("720")) return "hd";
    return "other";
}

const TIERS: { key: Tier; label: string; note: string }[] = [
    { key: "uhd", label: "4K", note: "Ultra HD" },
    { key: "fhd", label: "1080p", note: "Full HD" },
    { key: "hd", label: "720p", note: "HD" },
    { key: "other", label: "Other", note: "Everything else" },
];

/** Cached first, then the better release, then the bigger file */
function bestFirst(a: AddonSource, b: AddonSource) {
    const cachedDiff = Number(!!b.isCached) - Number(!!a.isCached);
    if (cachedDiff !== 0) return cachedDiff;
    const byQuality = getSourceQualityIndex(a.quality) - getSourceQualityIndex(b.quality);
    if (byQuality !== 0) return byQuality;
    return parseSize(b.size) - parseSize(a.size);
}

const SIZE_UNITS: Record<string, number> = { KB: 1e-6, MB: 1e-3, GB: 1, TB: 1e3 };

function parseSize(size?: string): number {
    const match = size?.match(/([\d.]+)\s*([KMGT]i?B)/i);
    if (!match) return 0;
    return Number(match[1]) * (SIZE_UNITS[match[2].replace("i", "").toUpperCase()] ?? 0);
}

const sourceKey = (source: AddonSource) => `${source.addonId}-${source.url}`;

/** Releases that agree on these are the same choice, whichever addon served them */
const variantKey = (source: AddonSource) =>
    source.quality || source.size
        ? `${source.quality ?? ""}-${source.size ?? ""}-${Number(!!source.isCached)}`
        : source.title;

function QuickPlayFrame({ controls, action, detail }: { controls: ReactNode; action: ReactNode; detail: ReactNode }) {
    return (
        <div className="flex flex-col gap-3 p-3 sm:gap-4 sm:p-4 md:p-5">
            <div className="flex flex-wrap items-center justify-center gap-2">{controls}</div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                <div className="order-1 flex shrink-0 flex-col gap-2 sm:order-2 sm:w-56">{action}</div>
                <div className="order-2 min-w-0 flex-1 space-y-1 border-t border-border/40 pt-3 sm:order-1 sm:border-t-0 sm:pt-0">
                    {detail}
                </div>
            </div>
        </div>
    );
}

export function QuickPlaySkeleton() {
    return (
        <QuickPlayFrame
            controls={
                <>
                    <Skeleton className="h-8 w-44 rounded-sm" />
                    <Skeleton className="h-8 w-full max-w-72 sm:w-80 rounded-sm" />
                </>
            }
            action={
                <>
                    <Skeleton className="h-11 w-full sm:h-10 rounded-sm" />
                    <Skeleton className="h-9 w-full sm:h-8 rounded-sm" />
                </>
            }
            detail={
                <>
                    <Skeleton className="h-2.5 w-24" />
                    <Skeleton className="h-3 w-3/5" />
                </>
            }
        />
    );
}

export function SimpleSources({ sources, request }: { sources: AddonSource[]; request: StreamingRequest }) {
    const [pickedTier, setPickedTier] = useState<Tier | null>(null);
    const [pickedKey, setPickedKey] = useState<string | null>(null);
    const streamingSettings = useSettingsStore((s) => s.settings.streaming);

    const pinned = useRef<AddonSource | null>(null);
    const best = useMemo(() => selectBestSource(sources, streamingSettings).source, [sources, streamingSettings]);
    // Pinned so a late-arriving addon cannot re-point Play at a source the user never read
    if (best && !pinned.current) pinned.current = best;
    const preferred = pinned.current;

    const tiers = useMemo(() => {
        const byTier = new Map<Tier, AddonSource[]>();
        for (const source of sources) {
            if (!source.url && !source.magnet) continue;
            const tier = resolutionTier(source.resolution);
            byTier.set(tier, [...(byTier.get(tier) ?? []), source]);
        }
        return TIERS.filter((t) => byTier.has(t.key)).map((t) => {
            const seen = new Map<string, AddonSource>();
            for (const source of (byTier.get(t.key) as AddonSource[]).sort(bestFirst)) {
                const variant = variantKey(source);
                if (!seen.has(variant)) seen.set(variant, source);
            }
            return { ...t, releases: Array.from(seen.values()) };
        });
    }, [sources]);

    const preferredTier = preferred && resolutionTier(preferred.resolution);
    const tier =
        tiers.find((t) => t.key === pickedTier) ??
        tiers.find((t) => t.key === preferredTier) ??
        tiers.find((t) => t.releases[0].isCached) ??
        tiers[0];

    const preferredRelease =
        preferred && tier?.key === preferredTier
            ? tier.releases.find((r) => variantKey(r) === variantKey(preferred))
            : undefined;
    const active = tier?.releases.find((r) => variantKey(r) === pickedKey) ?? preferredRelease ?? tier?.releases[0];

    if (!tier || !active) return null;

    return (
        <QuickPlayFrame
            controls={
                <>
                    <div className="min-w-0 overflow-x-auto">
                        <ToggleGroup
                            type="single"
                            variant="outline"
                            size="sm"
                            value={tier.key}
                            onValueChange={(value) => {
                                if (!value) return;
                                setPickedTier(value as Tier);
                                setPickedKey(null);
                            }}>
                            {tiers.map(({ key, label, releases }) => (
                                <ToggleGroupItem key={key} value={key} aria-label={label} className="h-8 text-xs">
                                    {releases[0].isCached && <Zap className="size-3 fill-current text-green-600" />}
                                    <span className="tabular-nums">{label}</span>
                                </ToggleGroupItem>
                            ))}
                        </ToggleGroup>
                    </div>

                    <Select value={variantKey(active)} onValueChange={setPickedKey}>
                        <SelectTrigger
                            size="sm"
                            className="w-full max-w-72 sm:w-80 text-xs *:data-[slot=select-value]:truncate">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent
                            position="popper"
                            className="max-h-[min(20rem,var(--radix-select-content-available-height))] min-w-(--radix-select-trigger-width) max-w-[calc(100vw-1.5rem)]">
                            {tier.releases.map((release) => (
                                <SelectItem
                                    key={variantKey(release)}
                                    value={variantKey(release)}
                                    className="text-xs whitespace-nowrap">
                                    <span className="flex items-center gap-1.5">
                                        {release.isCached && <Zap className="size-3 fill-current text-green-600" />}
                                        <span>{release.quality ?? "Standard"}</span>
                                        {release.size && (
                                            <span className="tabular-nums text-muted-foreground">{release.size}</span>
                                        )}
                                    </span>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </>
            }
            action={
                <>
                    {active.url && (
                        <Button
                            size="lg"
                            className="h-11 w-full sm:h-10"
                            onClick={() => useStreamingStore.getState().playSource(active, request)}>
                            <PlayIcon className="size-4 fill-current" />
                            Play {active.size ? `(${active.size})` : `(${tier.label})`}
                        </Button>
                    )}
                    <AddSourceButton
                        key={sourceKey(active)}
                        magnet={active.magnet}
                        url={active.url}
                        className="h-9 w-full sm:h-8"
                    />
                </>
            }
            detail={
                <>
                    <p className="text-[10px] sm:text-[11px] tracking-[0.2em] uppercase text-muted-foreground/60">
                        {active.addonName}
                    </p>
                    <p className="text-xs text-muted-foreground leading-snug wrap-break-word">{active.title}</p>
                    {active.description && (
                        <p className="text-[11px] leading-relaxed text-muted-foreground/70 whitespace-pre-wrap wrap-break-word">
                            {active.description}
                        </p>
                    )}
                </>
            }
        />
    );
}

export const SourceRow = memo(function SourceRow({
    source,
    request,
}: {
    source: AddonSource;
    request: StreamingRequest;
}) {
    const tier = resolutionTier(source.resolution);
    const resolutionLabel = source.resolution || TIERS.find((t) => t.key === tier)?.label;
    const resolutionTone = tier === "uhd" ? "text-primary" : "text-foreground";

    return (
        <div className="group/source flex flex-col gap-2 px-3 sm:px-4 md:px-5 py-3 sm:py-3.5 transition-colors border-b border-border/40 last:border-0 hover:bg-muted/20">
            {/* Status line — cached · resolution · quality · size */}
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] sm:text-xs tracking-wider uppercase">
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
            <div className="text-sm sm:text-base font-light leading-snug wrap-break-word">{source.title}</div>

            {/* Description */}
            {source.description && (
                <p className="text-[11px] sm:text-xs text-muted-foreground whitespace-pre-wrap wrap-break-word leading-relaxed">
                    {source.description}
                </p>
            )}

            {/* Controls row — addon kicker (left) + actions (right) */}
            <div className="flex items-center justify-between gap-3 flex-wrap pt-0.5">
                <div className="text-[10px] sm:text-[11px] tracking-[0.2em] uppercase text-muted-foreground/70">
                    {source.addonName}
                </div>
                {(source.url || source.magnet) && (
                    <div className="flex items-center gap-2 shrink-0">
                        <AddSourceButton magnet={source.magnet} url={source.url} />
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

function SourceRowSkeleton() {
    return (
        <div className="flex items-stretch gap-3 sm:gap-4 px-3 sm:px-4 md:px-5 py-3 sm:py-3.5 border-b border-border/40 last:border-0">
            <div className="flex-1 space-y-2 py-0.5">
                <Skeleton className="h-2.5 w-1/3" />
                <Skeleton className="h-3.5 w-4/5" />
                <Skeleton className="h-2.5 w-1/4" />
            </div>
            <Skeleton className="hidden sm:block w-24 h-8 self-center" />
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

    const quickPlay = useSettingsStore((s) => s.settings.quickPlay);
    const setSetting = useSettingsStore((s) => s.set);

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
        () => (quickPlay || addonFilter === "all" ? sources : sources?.filter((s) => s.addonId === addonFilter)),
        [sources, addonFilter, quickPlay]
    );

    const total = filtered?.length ?? 0;
    const hasPickable = !!filtered?.some((s) => s.url || s.magnet);

    return (
        <div className="space-y-2">
            {/* Editorial header — count summary + addon filter */}
            <div className="flex items-center justify-between gap-3 px-3 sm:px-4 lg:px-5 pt-2 h-9">
                <div className="inline-flex items-center gap-2 sm:gap-3 text-[11px] sm:text-xs lg:text-xs tracking-[0.2em] sm:tracking-[0.25em] uppercase text-muted-foreground/80">
                    {isLoading ? (
                        <span className="inline-flex items-center gap-1.5">
                            <Loader2 className="size-3 animate-spin" />
                            <span className="hidden sm:inline">Loading sources</span>
                        </span>
                    ) : quickPlay ? (
                        "Choose quality"
                    ) : total > 0 ? (
                        <span className="inline-flex items-center gap-1.5">
                            <LayersIcon className="size-3 text-muted-foreground/70 sm:hidden" />
                            <span className="tabular-nums text-foreground/80">{String(total).padStart(2, "0")}</span>
                            <span className="hidden sm:inline">Sources</span>
                        </span>
                    ) : (
                        "No Sources"
                    )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    {!quickPlay && addonNames.length > 1 && (
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
                    <ToggleGroup
                        type="single"
                        variant="outline"
                        size="sm"
                        value={quickPlay ? "quick" : "all"}
                        onValueChange={(value) => value && setSetting("quickPlay", value === "quick")}
                        className="opacity-50 transition-opacity hover:opacity-100 has-[:focus-visible]:opacity-100">
                        <ToggleGroupItem value="quick" aria-label="Quick play picker" title="Quick play picker">
                            <Wand2 className="size-3.5" />
                        </ToggleGroupItem>
                        <ToggleGroupItem value="all" aria-label="Every source" title="Every source">
                            <ListIcon className="size-3.5" />
                        </ToggleGroupItem>
                    </ToggleGroup>
                </div>
            </div>

            <div className={cn("border border-border/40 rounded-sm overflow-hidden", className)}>
                {quickPlay
                    ? hasPickable && <SimpleSources sources={filtered ?? []} request={request} />
                    : filtered?.map((source, index) => (
                          <SourceRow
                              key={`${source.addonId}-${source.url || index}`}
                              source={source}
                              request={request}
                          />
                      ))}

                {isLoading &&
                    (quickPlay ? (
                        !hasPickable && <QuickPlaySkeleton />
                    ) : (
                        <>
                            <SourceRowSkeleton />
                            <SourceRowSkeleton />
                            <SourceRowSkeleton />
                        </>
                    ))}

                {!isLoading && (quickPlay ? !hasPickable : filtered?.length === 0) && (
                    <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                        <p className="text-sm font-light text-foreground/80">Nothing to play yet</p>
                        <p className="text-xs text-muted-foreground/70 mt-1.5">
                            {quickPlay
                                ? "Try again in a moment, or add addons in settings"
                                : "Configure stream-capable addons in settings"}
                        </p>
                    </div>
                )}

                {!isLoading && failedAddons.length > 0 && (
                    <div className="flex items-center justify-center gap-2 px-4 py-2.5 bg-destructive/4 border-t border-destructive/20">
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
