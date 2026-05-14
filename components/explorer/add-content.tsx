"use client";

import { ClipboardPaste, FileUp, Link as LinkIcon, Loader2, Paperclip, Plus, X } from "lucide-react";
import { useState } from "react";
import { type FileRejection, useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { useAuthGuaranteed } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { queryClient } from "@/lib/query-client";
import type { OperationResult } from "@/lib/types";
import { cn, getTextFromClipboard } from "@/lib/utils";

type AddResult = Record<string, OperationResult>;

const TORRENT_ACCEPT = { "application/x-bittorrent": [".torrent"] };

export function AddContent() {
    const [links, setLinks] = useState("");
    const [isAddingLinks, setIsAddingLinks] = useState(false);
    const [isUploadingFiles, setIsUploadingFiles] = useState(false);
    const { client, currentAccount } = useAuthGuaranteed();

    const linkCount = links
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean).length;

    const isBusy = isAddingLinks || isUploadingFiles;

    const handleOperationResults = (results: AddResult, itemType: "link" | "file", toastId: string | number) => {
        let successCount = 0;
        let errorCount = 0;

        Object.entries(results).forEach(([name, status]) => {
            if (status.success) successCount++;
            else {
                errorCount++;
                toast.error(`${name}: ${status.message}`);
            }
        });

        const toastfn = successCount > 0 ? toast.success : toast.error;
        let message = `Successfully ${itemType === "link" ? "added" : "uploaded"} ${successCount} ${itemType}${successCount === 1 ? "" : "s"}`;
        if (errorCount > 0) {
            message += `, ${errorCount} ${itemType}${errorCount === 1 ? "" : "s"} failed.`;
        }
        toastfn(message, { id: toastId });

        if (successCount > 0) {
            queryClient.invalidateQueries({
                queryKey: [currentAccount.id, "getTorrentList"],
            });
        }

        return successCount > 0;
    };

    const uploadFiles = async (files: File[]) => {
        if (!files.length) return;
        setIsUploadingFiles(true);
        const toastId = toast.loading(`Uploading ${files.length} file${files.length === 1 ? "" : "s"}`);
        try {
            const results = await client.uploadTorrentFiles(files);
            handleOperationResults(results, "file", toastId);
        } catch (error) {
            toast.error("Failed to upload files", { id: toastId });
            console.error(error);
        } finally {
            setIsUploadingFiles(false);
        }
    };

    const handleAddLinks = async () => {
        const uris = links
            .split("\n")
            .map((l) => l.trim())
            .filter(Boolean);
        if (!uris.length) {
            toast.error("Please enter at least one link");
            return;
        }

        setIsAddingLinks(true);
        const toastId = toast.loading(`Adding ${uris.length} link${uris.length === 1 ? "" : "s"}`);
        try {
            const results = await client.addTorrent(uris);
            const success = handleOperationResults(results, "link", toastId);
            if (success) setLinks("");
        } catch (error) {
            toast.error("Failed to add links", { id: toastId });
            console.error(error);
        } finally {
            setIsAddingLinks(false);
        }
    };

    const handlePaste = async () => {
        const text = await getTextFromClipboard();
        if (!text) return;
        setLinks((prev) => (prev ? `${prev.trimEnd()}\n${text}` : text));
    };

    const onDrop = (accepted: File[], rejections: FileRejection[]) => {
        if (rejections.length) {
            toast.error(rejections[0]?.errors[0]?.message ?? "File rejected");
            return;
        }
        uploadFiles(accepted);
    };

    const {
        getRootProps,
        getInputProps,
        isDragActive,
        open: openFilePicker,
    } = useDropzone({
        accept: TORRENT_ACCEPT,
        maxFiles: 100,
        disabled: isBusy,
        noClick: true,
        noKeyboard: true,
        onDrop,
    });

    return (
        <section
            aria-label="Add Content"
            className="relative max-sm:-mx-4 sm:mt-3 sm:rounded-sm sm:border sm:border-border/50 sm:bg-background">
            {/* Editorial label — pinned to top border on sm+ (fieldset legend style) */}
            <div className="hidden sm:flex absolute -top-2.5 left-5 items-center gap-2 px-2 bg-background">
                <Plus className="size-3.5 text-primary" strokeWidth={1.5} />
                <span className="text-[11px] tracking-widest uppercase text-muted-foreground font-light">
                    Add Content
                </span>
            </div>

            <div className="px-4 py-3 sm:px-6 sm:py-5 sm:pt-6 space-y-3 sm:space-y-4">
                {/* Inline editorial label — mobile only */}
                <div className="flex items-center gap-3 sm:hidden">
                    <Plus className="size-4 text-primary" strokeWidth={1.5} />
                    <span className="text-xs tracking-widest uppercase text-muted-foreground font-light">
                        Add Content
                    </span>
                    <div className="h-px flex-1 bg-border/50" />
                </div>

                {/* Composite input region: textarea + drop overlay + inline actions */}
                <div
                    {...getRootProps()}
                    className={cn(
                        "relative rounded-sm border border-border/50 bg-muted/20 transition-colors duration-200",
                        "focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/20",
                        isDragActive && "border-primary/60 bg-primary/5 ring-3 ring-primary/15"
                    )}>
                    <input {...getInputProps()} />

                    <Textarea
                        placeholder="Paste magnet links, .torrent URLs &mdash; one per line"
                        value={links}
                        onChange={(e) => setLinks(e.target.value)}
                        disabled={isAddingLinks}
                        rows={3}
                        className={cn(
                            "font-mono text-sm leading-relaxed resize-none",
                            "min-h-24 sm:min-h-32 lg:min-h-40 max-h-64",
                            "border-0 bg-transparent shadow-none ring-0 focus-visible:ring-0 focus-visible:border-0",
                            "pr-12 sm:pr-14"
                        )}
                    />

                    {/* Inline actions: paste + clear */}
                    <div className="absolute top-2 right-2 flex flex-col gap-0.5">
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon-xs"
                            onClick={handlePaste}
                            disabled={isBusy}
                            className="text-muted-foreground hover:text-foreground"
                            aria-label="Paste from clipboard">
                            <ClipboardPaste className="size-3.5" />
                        </Button>
                        {links.trim() && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon-xs"
                                onClick={() => setLinks("")}
                                disabled={isAddingLinks}
                                className="text-muted-foreground hover:text-foreground"
                                aria-label="Clear">
                                <X className="size-3.5" />
                            </Button>
                        )}
                    </div>

                    {/* Drop overlay */}
                    <div
                        aria-hidden
                        className={cn(
                            "absolute inset-0 flex flex-col items-center justify-center gap-2",
                            "bg-primary/5 backdrop-blur-[1px] rounded-sm border-2 border-dashed border-primary/50",
                            "transition-opacity duration-200 pointer-events-none",
                            isDragActive ? "opacity-100" : "opacity-0"
                        )}>
                        <FileUp className="size-6 text-primary" strokeWidth={1.5} />
                        <span className="text-xs tracking-widest uppercase font-light text-primary">
                            Drop to upload
                        </span>
                    </div>
                </div>

                {/* Footer: attach + primary CTA */}
                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <button
                            type="button"
                            onClick={openFilePicker}
                            disabled={isBusy}
                            className={cn(
                                "inline-flex items-center gap-1.5 h-8 px-2 -mx-2 rounded-sm cursor-pointer",
                                "text-foreground hover:bg-muted/40 active:bg-muted/50 transition-colors",
                                "disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed"
                            )}>
                            {isUploadingFiles ? (
                                <Loader2 className="size-3.5 animate-spin" />
                            ) : (
                                <Paperclip className="size-3.5" strokeWidth={1.5} />
                            )}
                            <span className="font-light">
                                {isUploadingFiles ? "Uploading…" : "Upload .torrent files"}
                            </span>
                        </button>
                        <span className="text-border hidden sm:inline">·</span>
                        <span className="hidden sm:inline font-light">or drop anywhere above</span>
                    </div>

                    <Button
                        type="button"
                        size="default"
                        onClick={handleAddLinks}
                        disabled={isAddingLinks || linkCount === 0}
                        className="w-full sm:w-auto">
                        {isAddingLinks ? (
                            <>
                                <Loader2 className="size-4 animate-spin" />
                                Adding…
                            </>
                        ) : (
                            <>
                                <LinkIcon className="size-4" />
                                Add{linkCount > 0 ? ` ${linkCount} link${linkCount === 1 ? "" : "s"}` : " links"}
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </section>
    );
}
