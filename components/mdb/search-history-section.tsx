"use client";

import { useRouter } from "@bprogress/next/app";
import { Clock, Film, Star, Tv, X } from "lucide-react";
import { memo, useState } from "react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { SearchItemWrapper } from "@/components/search-item-wrapper";
import { useClearSearchHistory, useRemoveFromSearchHistory, useSearchHistory } from "@/hooks/use-search-history";
import type { SearchHistory } from "@/lib/db/schema";
import { cn } from "@/lib/utils";

interface SearchHistorySectionProps {
    variant?: "modal" | "page";
    onItemClick?: () => void;
    /** Maximum entries to render. Defaults: 20 on page, 8 in modal. */
    limit?: number;
}

/** Derive the route URL for a history entry. URL structure lives here so it can change without a backfill. */
function deriveHref(entry: SearchHistory): string {
    switch (entry.metadata.kind) {
        case "trakt": {
            const m = entry.metadata;
            return `/${m.type}s/${m.slug ?? m.imdbId ?? entry.providerId}`;
        }
        default:
            return "/";
    }
}

function deriveKicker(entry: SearchHistory): string {
    switch (entry.metadata.kind) {
        case "trakt":
            return entry.metadata.type === "movie" ? "Film" : "Series";
        default:
            return entry.provider;
    }
}

function derivePoster(entry: SearchHistory): string | undefined {
    if (entry.metadata.kind === "trakt") return entry.metadata.posterUrl;
    return undefined;
}

function deriveSubtitle(entry: SearchHistory): string | undefined {
    if (entry.metadata.kind === "trakt") return entry.metadata.subtitle;
    return undefined;
}

function deriveYear(entry: SearchHistory): number | undefined {
    if (entry.metadata.kind === "trakt") return entry.metadata.year;
    return undefined;
}

function deriveRating(entry: SearchHistory): number | undefined {
    if (entry.metadata.kind === "trakt") return entry.metadata.rating;
    return undefined;
}

const HistoryRow = memo(function HistoryRow({
    entry,
    variant,
    onSelect,
    onRemove,
}: {
    entry: SearchHistory;
    variant: "modal" | "page";
    onSelect: (entry: SearchHistory) => void;
    onRemove: () => void;
}) {
    const poster = derivePoster(entry);
    const kicker = deriveKicker(entry);
    const subtitle = deriveSubtitle(entry);
    const year = deriveYear(entry);
    const rating = deriveRating(entry);
    const isMovie = entry.metadata.kind === "trakt" && entry.metadata.type === "movie";
    const Icon = isMovie ? Film : Tv;

    return (
        <SearchItemWrapper
            data={entry}
            variant={variant}
            onSelect={onSelect}
            commandValue={`history-${entry.provider}-${entry.providerId}`}
            commandKeywords={[entry.title, kicker, subtitle ?? ""]}>
            <div className="shrink-0 w-12 h-[72px] sm:w-14 sm:h-[84px] overflow-hidden rounded-sm bg-muted/50 ring-1 ring-border/30">
                {poster ? (
                    <img
                        src={poster}
                        alt={entry.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        decoding="async"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <Icon className="size-4 text-muted-foreground" />
                    </div>
                )}
            </div>
            <div className="flex-1 min-w-0">
                <h4 className="font-light truncate text-sm sm:text-base">{entry.title}</h4>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] sm:text-[11px] text-muted-foreground mt-0.5">
                    <span
                        className={cn("tracking-[0.2em] uppercase", isMovie ? "text-amber-400/90" : "text-sky-400/90")}>
                        {kicker}
                    </span>
                    {year && (
                        <>
                            <span className="text-border">·</span>
                            <span className="tabular-nums">{year}</span>
                        </>
                    )}
                    {!!rating && (
                        <>
                            <span className="text-border">·</span>
                            <span className="inline-flex items-center gap-1">
                                <Star className="size-3 fill-[#F5C518] text-[#F5C518] -translate-y-px" />
                                <span className="tabular-nums">{rating.toFixed(1)}</span>
                            </span>
                        </>
                    )}
                </div>
                {subtitle && (
                    <p className="text-xs text-muted-foreground/80 leading-relaxed line-clamp-2 mt-1.5 max-w-2xl">
                        {subtitle}
                    </p>
                )}
            </div>
            <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation();
                    onRemove();
                }}
                onPointerDown={(e) => e.stopPropagation()}
                aria-label="Remove from history"
                className="shrink-0 inline-flex items-center justify-center size-7 rounded-sm text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 transition-colors opacity-100 sm:opacity-0 sm:group-hover/row:opacity-100 focus-visible:opacity-100 cursor-pointer">
                <X className="size-3.5" />
            </button>
        </SearchItemWrapper>
    );
});

export const SearchHistorySection = memo(function SearchHistorySection({
    variant = "page",
    onItemClick,
    limit,
}: SearchHistorySectionProps) {
    const isModal = variant === "modal";
    const router = useRouter();
    const { data: history = [] } = useSearchHistory();
    const { mutate: removeEntry } = useRemoveFromSearchHistory();
    const { mutate: clearAll } = useClearSearchHistory();
    const [confirmOpen, setConfirmOpen] = useState(false);

    if (history.length === 0) return null;

    const cap = limit ?? (isModal ? 8 : 20);
    const entries = history.slice(0, cap);

    const handleSelect = (entry: SearchHistory) => {
        router.push(deriveHref(entry));
        onItemClick?.();
    };

    const listClass = isModal
        ? "divide-y divide-border/30"
        : "-mx-4 lg:mx-0 divide-y divide-border/30 lg:border lg:border-border/40 lg:rounded-sm lg:overflow-hidden";
    const headerPadding = isModal ? "px-4 lg:px-5" : undefined;

    return (
        <section className="space-y-4 sm:space-y-5">
            <div className={cn("flex items-center justify-between gap-2", headerPadding)}>
                <div className="flex items-center gap-2">
                    <Clock className="size-3.5 text-muted-foreground/70 shrink-0" />
                    <h3 className="text-[10px] sm:text-xs tracking-[0.25em] uppercase text-muted-foreground">Recent</h3>
                    <span className="text-[10px] sm:text-xs text-muted-foreground/60 tabular-nums">
                        · {String(entries.length).padStart(2, "0")}
                    </span>
                </div>
                <button
                    type="button"
                    onClick={() => setConfirmOpen(true)}
                    className="text-[10px] tracking-[0.25em] uppercase text-muted-foreground/60 hover:text-destructive transition-colors cursor-pointer">
                    Clear
                </button>
            </div>

            <div className={listClass}>
                {entries.map((entry) => (
                    <HistoryRow
                        key={`${entry.provider}-${entry.providerId}`}
                        entry={entry}
                        variant={variant}
                        onSelect={handleSelect}
                        onRemove={() => removeEntry({ provider: entry.provider, providerId: entry.providerId })}
                    />
                ))}
            </div>

            <ConfirmDialog
                open={confirmOpen}
                onOpenChange={setConfirmOpen}
                title="Clear search history?"
                description="This will remove every entry from your recent searches. This action cannot be undone."
                confirmText="Clear all"
                variant="destructive"
                onConfirm={() => clearAll({})}
            />
        </section>
    );
});
