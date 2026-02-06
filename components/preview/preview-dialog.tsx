"use client";

import { useEffect, useCallback, useRef, useMemo } from "react";
import { usePreviewStore } from "@/lib/stores/preview";
import { useAuthGuaranteed } from "@/components/auth/auth-provider";
import { useQuery } from "@tanstack/react-query";
import { useSettingsStore } from "@/lib/stores/settings";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ChevronLeft, ChevronRight, Download, X, Loader2 } from "lucide-react";
import { PreviewContent } from "./preview-content";
import { formatSize, downloadLinks, getFileType } from "@/lib/utils";
import { getDownloadLinkCacheKey } from "@/lib/utils/cache-keys";
import { DebridFileNode } from "@/lib/types";

export function PreviewDialog() {
    const { client, currentAccount } = useAuthGuaranteed();
    const { get } = useSettingsStore();
    const downloadLinkMaxAge = get("downloadLinkMaxAge");

    const previousButtonRef = useRef<HTMLButtonElement>(null);
    const nextButtonRef = useRef<HTMLButtonElement>(null);

    const {
        isOpen,
        mode,
        currentFile,
        currentIndex,
        previewableFiles,
        directUrl,
        directTitle,
        fileType,
        closePreview,
        navigateNext,
        navigatePrevious,
    } = usePreviewStore();

    const isSingleMode = mode === "single";

    // Create mock file node for single mode
    const singleFileNode = useMemo<DebridFileNode | null>(() => {
        if (!isSingleMode || !directUrl || !directTitle) return null;
        return { id: directUrl, name: directTitle, size: undefined, type: "file", children: [] };
    }, [isSingleMode, directUrl, directTitle]);

    // Fetch download link for current file (gallery mode only)
    const { data: linkInfo, isLoading } = useQuery({
        queryKey: getDownloadLinkCacheKey(currentAccount.id, currentFile?.id || "", true),
        queryFn: () => client.getDownloadLink({ fileNode: currentFile!, resolve: true }),
        enabled: isOpen && !isSingleMode && !!currentFile?.id,
        gcTime: downloadLinkMaxAge,
    });

    // Keyboard navigation
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            switch (e.key) {
                case "ArrowLeft":
                    if (!isSingleMode) {
                        e.preventDefault();
                        navigatePrevious();
                        previousButtonRef.current?.focus();
                    }
                    break;
                case "ArrowRight":
                    if (!isSingleMode) {
                        e.preventDefault();
                        navigateNext();
                        nextButtonRef.current?.focus();
                    }
                    break;
                case "Escape":
                    e.preventDefault();
                    closePreview();
                    break;
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, isSingleMode, navigateNext, navigatePrevious, closePreview]);

    const handleDownload = useCallback(() => {
        if (linkInfo) {
            downloadLinks([linkInfo]);
        }
    }, [linkInfo]);

    const activeFile = isSingleMode ? singleFileNode : currentFile;
    const activeUrl = isSingleMode ? directUrl : linkInfo?.link;
    const activeTitle = isSingleMode ? directTitle : currentFile?.name;
    const activeFileType = isSingleMode ? (fileType ?? getFileType(directTitle || "")) : undefined;

    if (!activeFile) return null;

    const hasMultipleFiles = !isSingleMode && previewableFiles.length > 1;
    const position = `${currentIndex + 1} / ${previewableFiles.length}`;

    return (
        <Dialog open={isOpen} onOpenChange={closePreview}>
            <DialogContent
                className="sm:max-w-[95vw] h-[95vh] p-0 gap-0 flex flex-col overflow-hidden outline-none!"
                showCloseButton={false}
                aria-describedby="preview-dialog-description">
                <DialogTitle className="sr-only">{activeTitle}</DialogTitle>
                <p id="preview-dialog-description" className="sr-only">
                    Preview of {activeTitle}
                </p>
                {/* Header */}
                <div className="flex items-center justify-between p-3 sm:p-4 border-b shrink-0 bg-background">
                    <div className="flex-1 min-w-0 mr-4">
                        <h2 className="text-lg font-semibold truncate">{activeTitle}</h2>
                        {!isSingleMode && activeFile.size && (
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-sm text-muted-foreground">{formatSize(activeFile.size)}</span>
                                {hasMultipleFiles && (
                                    <>
                                        <Separator orientation="vertical" className="h-4" />
                                        <Badge variant="outline" className="text-xs">
                                            {position}
                                        </Badge>
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        {!isSingleMode && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleDownload}
                                disabled={!linkInfo}
                                title="Download"
                                aria-label="Download file">
                                <Download className="h-4 w-4" />
                            </Button>
                        )}
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={closePreview}
                            title="Close (Esc)"
                            aria-label="Close preview (Esc)">
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Preview Content */}
                <div
                    className="flex-1 relative overflow-hidden min-h-0"
                    key={isSingleMode ? directUrl : currentFile?.id}>
                    {!isSingleMode && isLoading ? (
                        <div className="flex items-center justify-center h-full">
                            <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                    ) : activeUrl ? (
                        <PreviewContent file={activeFile} downloadUrl={activeUrl} fileType={activeFileType} />
                    ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                            <p>Unable to load preview</p>
                        </div>
                    )}

                    {/* Navigation Arrows */}
                    {hasMultipleFiles && (
                        <>
                            <Button
                                ref={previousButtonRef}
                                variant="ghost"
                                size="icon"
                                className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white h-10 w-10 z-30"
                                onClick={navigatePrevious}
                                title="Previous (←)"
                                aria-label="Previous file (Left arrow)">
                                <ChevronLeft className="h-6 w-6" />
                            </Button>
                            <Button
                                ref={nextButtonRef}
                                variant="ghost"
                                size="icon"
                                className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white h-10 w-10 z-30"
                                onClick={navigateNext}
                                title="Next (→)"
                                aria-label="Next file (Right arrow)">
                                <ChevronRight className="h-6 w-6" />
                            </Button>
                        </>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
