"use client";

import { memo } from "react";
import { CommandItem } from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { HardDrive, Users, CheckCircle2 } from "lucide-react";
import { cn, formatSize } from "@/lib/utils";
import { type TorBoxSearchResult } from "@/lib/clients/torbox";
import { AddSourceButton } from "./sources";

interface SearchSourceItemProps {
    result: TorBoxSearchResult;
    variant?: "modal" | "page";
    className?: string;
}

const SourceContent = memo(function SourceContent({ result }: { result: TorBoxSearchResult }) {
    return (
        <div className="flex-1 min-w-0">
            <div className="font-medium text-xs sm:text-sm mb-1.5 leading-tight wrap-break-word">
                {result.raw_title}
            </div>
            <div className="flex items-start gap-2">
                <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1 mb-1.5">
                        {result.cached && (
                            <Badge
                                variant="secondary"
                                className="text-xs px-1.5 py-0.5 h-5 bg-green-500/10 text-green-600">
                                <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" />
                                Cached
                            </Badge>
                        )}
                        <Badge variant="outline" className="text-xs px-1.5 py-0.5 h-5">
                            {result.type}
                        </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                            <HardDrive className="size-3" />
                            <span>{formatSize(result.size)}</span>
                        </div>
                        {result.files > 1 && (
                            <>
                                <span>•</span>
                                <span>{result.files} files</span>
                            </>
                        )}
                        <span>•</span>
                        <div className="flex items-center gap-1">
                            <Users className="size-3" />
                            <span>
                                {result.last_known_seeders}/{result.last_known_peers}
                            </span>
                        </div>
                        <span>•</span>
                        <span>{result.age}</span>
                    </div>
                </div>
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
    const content = <SourceContent result={result} />;

    if (variant === "modal") {
        return (
            <CommandItem
                key={`source-${result.hash}`}
                value={`source-${result.hash}-${result.title}`}
                keywords={[result.title, result.raw_title, result.hash]}
                className={cn("flex items-center gap-2 px-1 sm:px-3 py-2 sm:py-3", className)}>
                {content}
            </CommandItem>
        );
    }

    return (
        <div className={cn("flex items-center gap-2 px-3 py-3 rounded-md hover:bg-muted transition-colors", className)}>
            {content}
        </div>
    );
});
