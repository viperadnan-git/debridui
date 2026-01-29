"use client";

import { useMemo } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { DebridFileNode, FileType } from "@/lib/types";
import { getFileType } from "@/lib/utils";
import { canPreviewFile } from "@/lib/preview/registry";
import { PreviewContent } from "./preview-content";

interface UrlPreviewDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    url: string;
    title: string;
    /** Override auto-detected file type (useful when title doesn't have an extension) */
    fileType?: FileType;
}

export function UrlPreviewDialog({
    open,
    onOpenChange,
    url,
    title,
    fileType: explicitFileType,
}: UrlPreviewDialogProps) {
    const fileType = explicitFileType ?? getFileType(title);

    // Create a mock file node for PreviewContent
    const fileNode = useMemo<DebridFileNode>(
        () => ({
            id: url,
            name: title,
            size: undefined,
            type: "file",
            children: [],
        }),
        [url, title]
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="sm:max-w-[95vw] h-[95vh] p-0 gap-0 flex flex-col overflow-hidden outline-none!"
                showCloseButton={false}>
                <DialogTitle className="sr-only">{title}</DialogTitle>
                {/* Header */}
                <div className="flex items-center justify-between p-3 sm:p-4 border-b shrink-0 bg-background">
                    <div className="flex-1 min-w-0 mr-4">
                        <h2 className="text-lg font-semibold truncate">{title}</h2>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onOpenChange(false)}
                            title="Close (Esc)"
                            aria-label="Close preview (Esc)">
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Preview Content */}
                <div className="flex-1 relative overflow-hidden min-h-0 bg-black" key={url}>
                    {url && <PreviewContent file={fileNode} downloadUrl={url} fileType={fileType} />}
                </div>
            </DialogContent>
        </Dialog>
    );
}

/** Check if a file name can be previewed in browser */
export function canPreviewInBrowser(name: string): boolean {
    const fileType = getFileType(name);
    return canPreviewFile(fileType);
}
