"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useAuthContext } from "@/lib/contexts/auth";
import { queryClient } from "@/lib/query-client";
import { toast } from "sonner";
import { Upload, Link, FileUp, Loader2, ClipboardIcon } from "lucide-react";
import { Dropzone } from "../ui/dropzone";
import { getTextFromClipboard } from "@/lib/utils";

export function AddContent() {
    const [links, setLinks] = useState("");
    const [isAddingLinks, setIsAddingLinks] = useState(false);
    const [isUploadingFiles, setIsUploadingFiles] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { client, currentUser } = useAuthContext();

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
            const results = await client.addDownloads(uris);

            let successCount = 0;
            let errorCount = 0;

            Object.entries(results).forEach(([uri, status]) => {
                if (!status.error) {
                    successCount++;
                } else {
                    errorCount++;
                    toast.error(`${uri}: ${status.error}`);
                }
            });

            const toastfn = successCount > 0 ? toast.success : toast.error;
            let message = `Successfully added ${successCount} link${successCount > 1 ? "s" : ""}`;
            if (errorCount > 0) {
                message += `, ${errorCount} link${errorCount > 1 ? "s" : ""} failed.`;
            }

            toastfn(message, { id: toastId });

            if (successCount > 0) {
                queryClient.invalidateQueries({
                    queryKey: [currentUser.id, "getTorrentList"],
                });
            }
            setLinks("");
        } catch (error) {
            toast.error("Failed to add links");
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

            let successCount = 0;
            let errorCount = 0;

            Object.entries(results).forEach(([fileName, status]) => {
                if (!status.error) {
                    successCount++;
                } else {
                    errorCount++;
                    toast.error(`${fileName}: ${status.error}`);
                }
            });

            const toastfn = successCount > 0 ? toast.success : toast.error;
            let message = `Successfully uploaded ${successCount} file${successCount > 1 ? "s" : ""}`;
            if (errorCount > 0) {
                message += `, ${errorCount} file${errorCount > 1 ? "s" : ""} failed.`;
            }

            toastfn(message, { id: toastId });

            if (successCount > 0) {
                queryClient.invalidateQueries({
                    queryKey: [currentUser.id, "getTorrentList"],
                });
            }

            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        } catch (error) {
            toast.error("Failed to upload files", { id: toastId });
            console.error(error);
        } finally {
            setIsUploadingFiles(false);
        }
    };

    const handlePaste = async () => {
        const text = await getTextFromClipboard();
        setLinks(text);
        await addLinks(text);
    };

    const handleAddLinks = async () => {
        await addLinks(links);
    };

    return (
        <Card className="max-sm:-mx-4 max-sm:rounded-none max-sm:border-none">
            <CardHeader className="max-sm:gap-0">
                <CardTitle className="flex items-center gap-2">
                    <Upload className="size-5" />
                    Add Content
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4">
                    <div className="flex flex-col space-y-1 md:space-y-2">
                        <label className="text-sm font-bold">Upload Torrent Files</label>
                        <Dropzone
                            onDropAccepted={handleFileSelect}
                            disabled={isUploadingFiles}
                            maxFiles={100}
                            accept={{
                                "application/x-bittorrent": [".torrent"],
                            }}
                            className="max-sm:h-24">
                            <FileUp className="size-5 md:size-8 text-gray-400" />
                            <h3 className="font-bold text-sm md:text-md">Upload Torrent Files</h3>
                            <p className="text-xs md:text-sm font-medium text-muted-foreground">
                                Drag and drop or click to upload torrent files
                            </p>
                        </Dropzone>
                    </div>

                    <div className="flex flex-col space-y-2">
                        <label className="text-sm font-bold">Add Links (HTTP/Magnet)</label>
                        <Textarea
                            placeholder="Enter links (one per line)"
                            value={links}
                            onChange={(e) => setLinks(e.target.value)}
                            rows={4}
                            className="font-mono text-sm max-h-28 md:h-full"
                        />
                        <div className="flex flex-row gap-2">
                            <Button
                                onClick={handleAddLinks}
                                disabled={isAddingLinks || !links.trim()}
                                className="flex-1">
                                {isAddingLinks ? (
                                    <>
                                        <Loader2 className="mr-2 size-4 animate-spin" />
                                        Adding...
                                    </>
                                ) : (
                                    <>
                                        <Link className="mr-2 size-4" />
                                        Add Links
                                    </>
                                )}
                            </Button>
                            <Button variant="outline" disabled={isAddingLinks} onClick={handlePaste}>
                                <ClipboardIcon className="mr-2 size-4" />
                                Paste
                            </Button>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
