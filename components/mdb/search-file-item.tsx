"use client";

import { useCallback, memo } from "react";
import { CommandItem } from "@/components/ui/command";
import { HardDrive } from "lucide-react";
import { formatSize, cn } from "@/lib/utils";
import { type DebridFile } from "@/lib/types";
import { FileItemContextMenu } from "../explorer/file-item-context-menu";

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

    const handleSelect = useCallback(() => {
        onSelect(file);
    }, [file, onSelect]);

    const content = (
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
    );

    if (variant === "modal") {
        return (
            <CommandItem
                key={`file-${file.id}`}
                value={`file-${file.id}`}
                keywords={[file.name, file.id.toString()]}
                onSelect={handleSelect}
                className={cn("flex items-center gap-2 sm:gap-3 px-1 sm:px-3 py-2 sm:py-3 cursor-pointer", className)}>
                {content}
            </CommandItem>
        );
    }

    return (
        <div
            onClick={handleSelect}
            className={cn(
                "flex items-center gap-2 sm:gap-3 px-3 py-3 cursor-pointer rounded-md hover:bg-muted transition-colors",
                className
            )}>
            {content}
        </div>
    );
});
