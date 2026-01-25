"use client";

import { useEffect, useCallback, useRef } from "react";
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
import { formatSize, downloadLinks } from "@/lib/utils";
import { getDownloadLinkCacheKey } from "@/lib/utils/cache-keys";

export function FilePreviewDialog() {
    const { client, currentUser } = useAuthGuaranteed();
    const { get } = useSettingsStore();
    const downloadLinkMaxAge = get("downloadLinkMaxAge");

    const previousButtonRef = useRef<HTMLButtonElement>(null);
    const nextButtonRef = useRef<HTMLButtonElement>(null);

    const { isOpen, currentFile, currentIndex, previewableFiles, closePreview, navigateNext, navigatePrevious } =
        usePreviewStore();

    // Fetch download link for current file
    const { data: linkInfo, isLoading } = useQuery({
        queryKey: getDownloadLinkCacheKey(currentUser.id, currentFile?.id || "", true),
        queryFn: () => client.getDownloadLink({ fileNode: currentFile!, resolve: true }),
        enabled: isOpen && !!currentFile?.id,
        gcTime: downloadLinkMaxAge,
    });

    // Keyboard navigation
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            switch (e.key) {
                case "ArrowLeft":
                    e.preventDefault();
                    navigatePrevious();
                    // Focus the previous button for visual feedback
                    previousButtonRef.current?.focus();
                    break;
                case "ArrowRight":
                    e.preventDefault();
                    navigateNext();
                    // Focus the next button for visual feedback
                    nextButtonRef.current?.focus();
                    break;
                case "Escape":
                    e.preventDefault();
                    closePreview();
                    break;
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, navigateNext, navigatePrevious, closePreview]);

    const handleDownload = useCallback(() => {
        if (linkInfo) {
            downloadLinks([linkInfo]);
        }
    }, [linkInfo]);

    if (!currentFile) return null;

    const hasMultipleFiles = previewableFiles.length > 1;
    const position = `${currentIndex + 1} / ${previewableFiles.length}`;

    return (
        <Dialog open={isOpen} onOpenChange={closePreview}>
            <DialogContent
                className="sm:max-w-[95vw] h-[95vh] p-0 gap-0 flex flex-col overflow-hidden outline-none!"
                showCloseButton={false}>
                <DialogTitle className="sr-only">{currentFile.name}</DialogTitle>
                {/* Header */}
                <div className="flex items-center justify-between p-3 sm:p-4 border-b shrink-0 bg-background">
                    <div className="flex-1 min-w-0 mr-4">
                        <h2 className="text-lg font-semibold truncate">{currentFile.name}</h2>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm text-muted-foreground">{formatSize(currentFile.size)}</span>
                            {hasMultipleFiles && (
                                <>
                                    <Separator orientation="vertical" className="h-4" />
                                    <Badge variant="outline" className="text-xs">
                                        {position}
                                    </Badge>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleDownload}
                            disabled={!linkInfo}
                            title="Download"
                            aria-label="Download file">
                            <Download className="h-4 w-4" />
                        </Button>
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
                <div className="flex-1 relative overflow-hidden min-h-0">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-full">
                            <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                    ) : linkInfo ? (
                        <PreviewContent file={currentFile} downloadUrl={linkInfo.link} />
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
