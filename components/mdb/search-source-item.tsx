"use client";

import { HardDrive, Users, Zap } from "lucide-react";
import { memo } from "react";
import { SearchItemWrapper } from "@/components/search-item-wrapper";
import type { TorBoxSearchResult } from "@/lib/clients/torbox";
import { formatSize } from "@/lib/utils";
import { AddSourceButton } from "./sources";

interface SearchSourceItemProps {
    result: TorBoxSearchResult;
    variant?: "modal" | "page";
    className?: string;
}

const SourceContent = memo(function SourceContent({ result }: { result: TorBoxSearchResult }) {
    return (
        <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
            <div className="flex-1 min-w-0 space-y-1.5">
                {/* Status row */}
                <div className="flex items-center gap-2">
                    {result.cached ? (
                        <span className="inline-flex items-center gap-1 text-[10px] tracking-[0.2em] uppercase text-primary">
                            <Zap className="size-3 fill-current" /> Cached
                        </span>
                    ) : (
                        <span className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground/60">
                            Uncached
                        </span>
                    )}
                    <span className="text-border">·</span>
                    <span className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground/70">
                        {result.type}
                    </span>
                </div>

                {/* Title */}
                <h4 className="font-light leading-snug wrap-break-word text-sm sm:text-base">{result.raw_title}</h4>

                {/* Metadata */}
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                        <HardDrive className="size-3" />
                        <span className="tabular-nums">{formatSize(result.size)}</span>
                    </span>
                    {result.files > 1 && (
                        <>
                            <span className="text-border">·</span>
                            <span className="tabular-nums">{result.files} files</span>
                        </>
                    )}
                    <span className="text-border">·</span>
                    <span className="inline-flex items-center gap-1">
                        <Users className="size-3" />
                        <span className="tabular-nums">
                            {result.last_known_seeders}/{result.last_known_peers}
                        </span>
                    </span>
                    <span className="text-border">·</span>
                    <span>{result.age}</span>
                </div>
            </div>

            {/* Action */}
            <div className="shrink-0 self-start sm:self-center">
                <AddSourceButton magnet={result.magnet} />
            </div>
        </div>
    );
});

export const SearchSourceItem = memo(function SearchSourceItem({
    result,
    variant = "modal",
    className,
}: SearchSourceItemProps) {
    return (
        <SearchItemWrapper
            variant={variant}
            commandValue={`source-${result.hash}-${result.title}`}
            commandKeywords={[result.title, result.raw_title, result.hash]}
            className={className}>
            <SourceContent result={result} />
        </SearchItemWrapper>
    );
});
