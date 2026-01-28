"use client";

import { memo } from "react";
import { HardDrive } from "lucide-react";
import { formatSize } from "@/lib/utils";
import { type DebridFile } from "@/lib/types";
import { FileItemContextMenu } from "../explorer/file-item-context-menu";
import { SearchItemWrapper } from "@/components/search-item-wrapper";

interface SearchFileItemProps {
    file: DebridFile;
    onSelect: (file: DebridFile) => void;
    variant?: "modal" | "page";
    className?: string;
}

export const SearchFileItem = memo(function SearchFileItem({
    file,
    onSelect,
    variant = "modal",
    className,
}: SearchFileItemProps) {
    const sizeDisplay = formatSize(file.size);

    return (
        <SearchItemWrapper
            data={file}
            variant={variant}
            onSelect={onSelect}
            commandValue={`file-${file.id}`}
            commandKeywords={[file.name, file.id.toString()]}
            className={className}>
            <FileItemContextMenu file={file}>
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-sm bg-muted/50">
                        <HardDrive className="size-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="font-medium truncate text-sm mb-0.5">{file.name}</div>
                        <div className="flex items-center text-xs text-muted-foreground">
                            <span>{sizeDisplay}</span>
                            {file.status && (
                                <>
                                    <span className="text-border mx-1.5">·</span>
                                    <span className="capitalize">{file.status}</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </FileItemContextMenu>
        </SearchItemWrapper>
    );
});
