"use client";

import { memo } from "react";
import { HardDrive, Users, Zap } from "lucide-react";
import { formatSize } from "@/lib/utils";
import { type TorBoxSearchResult } from "@/lib/clients/torbox";
import { AddSourceButton } from "./sources";
import { SearchItemWrapper } from "@/components/search-item-wrapper";

interface SearchSourceItemProps {
    result: TorBoxSearchResult;
    variant?: "modal" | "page";
    className?: string;
}

const SourceContent = memo(function SourceContent({ result }: { result: TorBoxSearchResult }) {
    return (
        <div className="flex-1 min-w-0">
            {/* Title */}
            <div className="font-medium text-sm mb-1.5 leading-tight break-words">{result.raw_title}</div>

            <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                    {/* Cached indicator + type inline */}
                    <div className="flex items-center gap-2 mb-1">
                        {result.cached && (
                            <span className="inline-flex items-center gap-1 text-xs tracking-wide text-green-600">
                                <Zap className="size-4" /> Cached
                            </span>
                        )}
                        <span className="text-xs tracking-wide uppercase text-muted-foreground">{result.type}</span>
                    </div>

                    {/* Metadata with editorial separators */}
                    <div className="flex flex-wrap items-center text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                            <HardDrive className="size-4" />
                            {formatSize(result.size)}
                        </span>
                        {result.files > 1 && (
                            <>
                                <span className="text-border mx-1.5">·</span>
                                <span>{result.files} files</span>
                            </>
                        )}
                        <span className="text-border mx-1.5">·</span>
                        <span className="flex items-center gap-1">
                            <Users className="size-4" />
                            {result.last_known_seeders}/{result.last_known_peers}
                        </span>
                        <span className="text-border mx-1.5">·</span>
                        <span>{result.age}</span>
                    </div>
                </div>

                {/* Action button */}
                <div className="shrink-0">
                    <AddSourceButton magnet={result.magnet} />
                </div>
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
