"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { useAuthGuaranteed } from "@/components/auth/auth-provider";
import { queryClient } from "@/lib/query-client";
import { toast } from "sonner";
import { Link, FileUp, Loader2, ClipboardPaste, X } from "lucide-react";
import { Dropzone } from "../ui/dropzone";
import { getTextFromClipboard } from "@/lib/utils";
import { OperationResult } from "@/lib/types";

type AddResult = Record<string, OperationResult>;

export function AddContent() {
    const [links, setLinks] = useState("");
    const [isAddingLinks, setIsAddingLinks] = useState(false);
    const [isUploadingFiles, setIsUploadingFiles] = useState(false);
    const { client, currentAccount } = useAuthGuaranteed();

    const handleOperationResults = (results: AddResult, itemType: "link" | "file", toastId: string | number) => {
        let successCount = 0;
        let errorCount = 0;

        Object.entries(results).forEach(([name, status]) => {
            if (status.success) {
                successCount++;
            } else {
                errorCount++;
                toast.error(`${name}: ${status.message}`);
            }
        });

        const toastfn = successCount > 0 ? toast.success : toast.error;
        let message = `Successfully ${itemType === "link" ? "added" : "uploaded"} ${successCount} ${itemType}${successCount > 1 ? "s" : ""}`;
        if (errorCount > 0) {
            message += `, ${errorCount} ${itemType}${errorCount > 1 ? "s" : ""} failed.`;
        }

        toastfn(message, { id: toastId });

        if (successCount > 0) {
            queryClient.invalidateQueries({
                queryKey: [currentAccount.id, "getTorrentList"],
            });
        }

        return successCount > 0;
    };

    const addLinks = async (links: string) => {
        const trimmedLinks = links.trim();
        if (!trimmedLinks) {
            toast.error("Please enter at least one link");
            return;
        }

        const uris = trimmedLinks
            .split("\n")
            .map((link) => link.trim())
            .filter((link) => link.length > 0);

        setIsAddingLinks(true);
        const toastId = toast.loading(`Adding ${uris.length} link${uris.length > 1 ? "s" : ""}`);
        try {
            const results = await client.addTorrent(uris);
            const success = handleOperationResults(results, "link", toastId);
            if (success) {
                setLinks("");
            }
        } catch (error) {
            toast.error("Failed to add links", { id: toastId });
            console.error(error);
        } finally {
            setIsAddingLinks(false);
        }
    };

    const handleFileSelect = async (files: File[]) => {
        if (!files || files.length === 0) return;

        setIsUploadingFiles(true);
        const toastId = toast.loading(`Uploading ${files.length} file${files.length > 1 ? "s" : ""}`);
        try {
            const fileArray = Array.from(files);
            const results = await client.uploadTorrentFiles(fileArray);
            handleOperationResults(results, "file", toastId);
        } catch (error) {
            toast.error("Failed to upload files", { id: toastId });
            console.error(error);
        } finally {
            setIsUploadingFiles(false);
        }
    };

    const handlePaste = async () => {
        const text = await getTextFromClipboard();
        if (!text) return;
        setLinks((prev) => (prev ? prev.trimEnd() + "\n" + text : text));
    };

    const handleAddLinks = async () => {
        await addLinks(links);
    };

    return (
        <Card className="max-sm:-mx-4 max-sm:rounded-none max-sm:border-none">
            <CardContent className="space-y-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4">
                    <div className="flex flex-col space-y-1 md:space-y-2">
                        <label className="text-xs tracking-widest uppercase text-muted-foreground">
                            Upload Torrent Files
                        </label>
                        <Dropzone
                            onDropAccepted={handleFileSelect}
                            disabled={isUploadingFiles}
                            maxFiles={100}
                            accept={{
                                "application/x-bittorrent": [".torrent"],
                            }}
                            className="max-sm:h-24">
                            <FileUp className="size-5 md:size-8 text-muted-foreground" />
                            <p className="text-sm font-medium">Drop .torrent files here</p>
                            <p className="text-xs md:text-sm text-muted-foreground">or click to browse</p>
                        </Dropzone>
                    </div>

                    <div className="flex flex-col space-y-2">
                        <label className="text-xs tracking-widest uppercase text-muted-foreground">Add Links</label>
                        <div className="relative flex-1">
                            <Textarea
                                placeholder="Enter links (one per line)"
                                value={links}
                                onChange={(e) => setLinks(e.target.value)}
                                rows={4}
                                className="font-mono text-sm max-h-28 md:h-full pr-14"
                            />
                            <div className="absolute top-2 right-2 flex gap-0.5">
                                {links.trim() && (
                                    <Button
                                        variant="ghost"
                                        size="icon-xs"
                                        onClick={() => setLinks("")}
                                        disabled={isAddingLinks}
                                        className="text-muted-foreground hover:text-foreground"
                                        aria-label="Clear">
                                        <X className="size-3.5" />
                                    </Button>
                                )}
                                <Button
                                    variant="ghost"
                                    size="icon-xs"
                                    onClick={handlePaste}
                                    disabled={isAddingLinks}
                                    className="text-muted-foreground hover:text-foreground"
                                    aria-label="Paste from clipboard">
                                    <ClipboardPaste className="size-3.5" />
                                </Button>
                            </div>
                        </div>
                        <Button onClick={handleAddLinks} disabled={isAddingLinks || !links.trim()} className="w-full">
                            {isAddingLinks ? (
                                <>
                                    <Loader2 className="size-4 animate-spin" />
                                    Adding...
                                </>
                            ) : (
                                <>
                                    <Link className="size-4" />
                                    Add Links
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
