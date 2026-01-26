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
                <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                    <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-md bg-muted">
                        <HardDrive className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="font-medium truncate text-xs sm:text-sm mb-0.5">{file.name}</div>
                        <div className="flex items-center gap-1.5 sm:gap-2 text-xs text-muted-foreground">
                            <span>{sizeDisplay}</span>
                            {file.status && (
                                <>
                                    <span>•</span>
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
