"use client";

import { useState } from "react";
import { useWebDownloads } from "./web-downloads-provider";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Link2, Save } from "lucide-react";

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
            for (const r of results) {
                if (r.success) successCount++;
            }
            const failCount = results.length - successCount;

            if (successCount > 0 && failCount === 0) {
                toast.success(`Unlocked ${successCount} link${successCount > 1 ? "s" : ""}`);
                setLinksText("");
            } else if (successCount > 0 && failCount > 0) {
                toast.warning(`Unlocked ${successCount}, ${failCount} failed`);
                setLinksText("");
            } else {
                toast.error("Failed to unlock links");
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

    const isDisabled = isAdding || isSaving || !linksText.trim();

    return (
        <div className="rounded-sm border border-border/50 overflow-hidden">
            <div className="bg-muted/30 px-4 py-3 border-b border-border/50">
                <p className="text-xs tracking-wider uppercase text-muted-foreground">Paste Links</p>
            </div>
            <div className="p-4 space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="links" className="sr-only">
                        Links
                    </Label>
                    <Textarea
                        id="links"
                        placeholder="Paste links here (one per line)&#10;https://example.com/file1.zip&#10;https://example.com/file2.zip"
                        value={linksText}
                        onChange={(e) => setLinksText(e.target.value)}
                        disabled={isAdding || isSaving}
                        className="font-mono text-sm min-h-[120px] resize-y"
                    />
                    <p className="text-xs text-muted-foreground">
                        Enter URLs from supported hosters. Each link will be processed.
                    </p>
                </div>
                <div className="flex gap-2 pt-2">
                    <Button onClick={handleUnlock} disabled={isDisabled}>
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
                        <Button onClick={handleSave} disabled={isDisabled} variant="outline">
                            {isSaving ? (
                                <>
                                    <Loader2 className="size-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="size-4" />
                                    Save for Later
                                </>
                            )}
                        </Button>
                    ) : null}
                    {linksText.trim() ? (
                        <Button variant="ghost" onClick={() => setLinksText("")} disabled={isAdding || isSaving}>
                            Clear
                        </Button>
                    ) : null}
                </div>
            </div>
        </div>
    );
}
