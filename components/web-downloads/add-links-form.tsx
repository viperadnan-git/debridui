"use client";

import { ClipboardPaste, Link2, Loader2, Plus, Save, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn, getTextFromClipboard } from "@/lib/utils";
import { useWebDownloads } from "./web-downloads-provider";

function parseLinks(text: string): string[] {
    return text
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l.length > 0 && (l.startsWith("http://") || l.startsWith("https://")));
}

export function AddLinksForm() {
    const { addDownloads, isAdding, saveLinks, isSaving } = useWebDownloads();
    const [linksText, setLinksText] = useState("");

    const isBusy = isAdding || isSaving;
    const linkCount = parseLinks(linksText).length;

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
                if (r.success) successCount++;
                else if (r.error) errors.push(r.error);
            }
            for (const error of errors) toast.error(error);
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
        setLinksText((prev) => (prev ? `${prev.trimEnd()}\n${text}` : text));
    };

    return (
        <section
            aria-label="Add Links"
            className="relative max-sm:-mx-4 sm:rounded-sm sm:border sm:border-border/50 sm:bg-background">
            {/* Editorial label — pinned to top border on sm+ (fieldset legend style) */}
            <div className="hidden sm:flex absolute -top-2.5 left-5 items-center gap-2 px-2 bg-background">
                <Plus className="size-3.5 text-primary" strokeWidth={1.5} />
                <span className="text-[11px] tracking-widest uppercase text-muted-foreground font-light">
                    Add Links
                </span>
            </div>

            <div className="px-4 py-3 sm:px-6 sm:py-5 sm:pt-6 space-y-3 sm:space-y-4">
                {/* Inline editorial label — mobile only */}
                <div className="flex items-center gap-3 sm:hidden">
                    <Plus className="size-4 text-primary" strokeWidth={1.5} />
                    <span className="text-xs tracking-widest uppercase text-muted-foreground font-light">
                        Add Links
                    </span>
                    <div className="h-px flex-1 bg-border/50" />
                </div>

                {/* Composite input region */}
                <div
                    className={cn(
                        "relative rounded-sm border border-border/50 bg-muted/20 transition-colors duration-200",
                        "focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/20"
                    )}>
                    <Textarea
                        placeholder="Paste hoster links &mdash; one per line"
                        value={linksText}
                        onChange={(e) => setLinksText(e.target.value)}
                        disabled={isBusy}
                        rows={3}
                        className={cn(
                            "font-mono text-sm leading-relaxed resize-none",
                            "min-h-24 sm:min-h-32 lg:min-h-40 max-h-64",
                            "border-0 bg-transparent shadow-none ring-0 focus-visible:ring-0 focus-visible:border-0",
                            "pr-12 sm:pr-14"
                        )}
                    />

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
                        {linksText.trim() && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon-xs"
                                onClick={() => setLinksText("")}
                                disabled={isBusy}
                                className="text-muted-foreground hover:text-foreground"
                                aria-label="Clear">
                                <X className="size-3.5" />
                            </Button>
                        )}
                    </div>
                </div>

                {/* Footer: helper / save + primary CTA */}
                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {saveLinks ? (
                            <button
                                type="button"
                                onClick={handleSave}
                                disabled={isBusy || linkCount === 0}
                                className={cn(
                                    "inline-flex items-center gap-1.5 h-8 px-2 -mx-2 rounded-sm cursor-pointer",
                                    "text-foreground hover:bg-muted/40 active:bg-muted/50 transition-colors",
                                    "disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed"
                                )}>
                                {isSaving ? (
                                    <Loader2 className="size-3.5 animate-spin" />
                                ) : (
                                    <Save className="size-3.5" strokeWidth={1.5} />
                                )}
                                <span className="font-light">{isSaving ? "Saving…" : "Save for later"}</span>
                            </button>
                        ) : (
                            <span className="font-light">Supported hosters only</span>
                        )}
                        <span className="text-border hidden sm:inline">·</span>
                        <span className="hidden sm:inline font-light">
                            {linkCount > 0 ? `${linkCount} link${linkCount === 1 ? "" : "s"} ready` : "one per line"}
                        </span>
                    </div>

                    <Button
                        type="button"
                        size="default"
                        onClick={handleUnlock}
                        disabled={isBusy || linkCount === 0}
                        className="w-full sm:w-auto">
                        {isAdding ? (
                            <>
                                <Loader2 className="size-4 animate-spin" />
                                Unlocking…
                            </>
                        ) : (
                            <>
                                <Link2 className="size-4" />
                                Unlock{linkCount > 0 ? ` ${linkCount} link${linkCount === 1 ? "" : "s"}` : " links"}
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </section>
    );
}
