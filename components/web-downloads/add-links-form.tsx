"use client";

import { useState } from "react";
import { useWebDownloads } from "./web-downloads-provider";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Link2, Save, ClipboardPaste, X } from "lucide-react";
import { getTextFromClipboard } from "@/lib/utils";

function parseLinks(text: string): string[] {
    return text
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l.length > 0 && (l.startsWith("http://") || l.startsWith("https://")));
}

export function AddLinksForm() {
    const { addDownloads, isAdding, saveLinks, isSaving } = useWebDownloads();
    const [linksText, setLinksText] = useState("");

    const handleUnlock = async () => {
        const links = parseLinks(linksText);
        if (links.length === 0) {
            toast.error("Please enter at least one valid URL");
            return;
        }

        try {
            const results = await addDownloads(links);
            let successCount = 0;
            const errors: string[] = [];

            for (const r of results) {
                if (r.success) {
                    successCount++;
                } else if (r.error) {
                    errors.push(r.error);
                }
            }

            // Show individual error toasts
            for (const error of errors) {
                toast.error(error);
            }

            if (successCount > 0) {
                toast.success(`Unlocked ${successCount} link${successCount > 1 ? "s" : ""}`);
                setLinksText("");
            }
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to unlock links");
        }
    };

    const handleSave = async () => {
        if (!saveLinks) return;
        const links = parseLinks(linksText);
        if (links.length === 0) {
            toast.error("Please enter at least one valid URL");
            return;
        }

        try {
            await saveLinks(links);
            toast.success(`Saved ${links.length} link${links.length > 1 ? "s" : ""}`);
            setLinksText("");
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to save links");
        }
    };

    const handlePaste = async () => {
        const text = await getTextFromClipboard();
        if (!text) return;
        setLinksText((prev) => (prev ? prev.trimEnd() + "\n" + text : text));
    };

    const isBusy = isAdding || isSaving;
    const isDisabled = isBusy || !linksText.trim();
    const linkCount = parseLinks(linksText).length;

    return (
        <div className="rounded-sm border border-border/50 overflow-hidden">
            <div className="flex items-center justify-between bg-muted/30 px-4 py-3 border-b border-border/50">
                <p className="text-xs tracking-widest uppercase text-muted-foreground">Paste Links</p>
                {linkCount > 0 && (
                    <span className="text-xs text-muted-foreground">
                        {linkCount} link{linkCount !== 1 ? "s" : ""}
                    </span>
                )}
            </div>
            <div className="p-4 space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="links" className="sr-only">
                        Links
                    </Label>
                    <div className="relative">
                        <Textarea
                            id="links"
                            placeholder={
                                "Paste links here (one per line)\nhttps://example.com/file1.zip\nhttps://example.com/file2.zip"
                            }
                            value={linksText}
                            onChange={(e) => setLinksText(e.target.value)}
                            disabled={isBusy}
                            className="font-mono text-xs sm:text-sm min-h-[100px] sm:min-h-[120px] resize-y pr-14"
                        />
                        <div className="absolute top-2 right-2 flex gap-0.5">
                            {linksText.trim() && (
                                <Button
                                    variant="ghost"
                                    size="icon-xs"
                                    onClick={() => setLinksText("")}
                                    disabled={isBusy}
                                    className="text-muted-foreground hover:text-foreground"
                                    aria-label="Clear">
                                    <X className="size-3.5" />
                                </Button>
                            )}
                            <Button
                                variant="ghost"
                                size="icon-xs"
                                onClick={handlePaste}
                                disabled={isBusy}
                                className="text-muted-foreground hover:text-foreground"
                                aria-label="Paste from clipboard">
                                <ClipboardPaste className="size-3.5" />
                            </Button>
                        </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Enter URLs from supported hosters. Each link will be processed.
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button onClick={handleUnlock} disabled={isDisabled} className="flex-1 sm:flex-none">
                        {isAdding ? (
                            <>
                                <Loader2 className="size-4 animate-spin" />
                                Unlocking...
                            </>
                        ) : (
                            <>
                                <Link2 className="size-4" />
                                Unlock
                            </>
                        )}
                    </Button>
                    {saveLinks ? (
                        <Button
                            onClick={handleSave}
                            disabled={isDisabled}
                            variant="outline"
                            className="flex-1 sm:flex-none">
                            {isSaving ? (
                                <>
                                    <Loader2 className="size-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="size-4" />
                                    Save
                                </>
                            )}
                        </Button>
                    ) : null}
                </div>
            </div>
        </div>
    );
}
