"use client";

import { useState, useMemo, useCallback } from "react";
import { useUserAddons, useAddAddon, useRemoveAddon, useToggleAddon, useUpdateAddonOrders } from "@/hooks/use-addons";
import { AddonClient } from "@/lib/addons/client";
import { type Addon } from "@/lib/addons/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Loader2, CheckCircle2, Puzzle, Info, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { AddonCard, AddonCardSkeleton } from "@/components/addon-card";
import { CachedBadge } from "@/components/display";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { SectionDivider } from "@/components/section-divider";

const DEFAULT_ADDON_MANIFEST =
    "https://torrentio.strem.fun/providers=yts,eztv,rarbg,1337x,kickasstorrents,torrentgalaxy,magnetdl,horriblesubs,nyaasi,tokyotosho,anidex|qualityfilter=480p,other,scr,cam|limit=4/manifest.json";

export default function AddonsPage() {
    const { data: serverAddons = [], isLoading, refetch } = useUserAddons();
    const addAddonMutation = useAddAddon();
    const removeAddonMutation = useRemoveAddon();
    const toggleAddonMutation = useToggleAddon();
    const updateOrdersMutation = useUpdateAddonOrders();

    const [isAdding, setIsAdding] = useState(false);
    const [newAddonUrl, setNewAddonUrl] = useState("");
    const [validating, setValidating] = useState(false);
    const [addonToDelete, setAddonToDelete] = useState<Addon | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Memoize sorted addons to avoid re-sorting on every render
    const sortedAddons = useMemo(() => [...serverAddons].sort((a, b) => a.order - b.order), [serverAddons]);

    const handleRefresh = useCallback(async () => {
        setIsRefreshing(true);
        await refetch();
        setIsRefreshing(false);
    }, [refetch]);

    const handleAddAddon = async (url?: string) => {
        const addonUrl = url || newAddonUrl;

        if (!addonUrl.trim()) {
            toast.error("Please enter an addon URL");
            return;
        }

        setValidating(true);
        try {
            const client = new AddonClient({ url: addonUrl });
            const manifest = await client.fetchManifest();

            // Check if addon URL already exists
            const addonExists = serverAddons.some((addon) => addon.url === addonUrl);
            if (addonExists) {
                toast.error(`${manifest.name} addon is already added`);
                setValidating(false);
                return;
            }

            const newAddon: Omit<Addon, "id"> = {
                name: manifest.name,
                url: addonUrl,
                enabled: true,
                order: serverAddons.length,
            };

            await addAddonMutation.mutateAsync(newAddon);
            toast.success(`Added ${manifest.name} addon`);
            setNewAddonUrl("");
            setIsAdding(false);
        } catch (error) {
            toast.error(`Failed to add addon: ${error instanceof Error ? error.message : "Invalid addon URL"}`);
        } finally {
            setValidating(false);
        }
    };

    const handleRemoveAddon = (addon: Addon) => {
        setAddonToDelete(addon);
    };

    const confirmRemoveAddon = async () => {
        if (!addonToDelete) return;

        await removeAddonMutation.mutateAsync(addonToDelete.id);
        toast.success(`Removed ${addonToDelete.name} addon`);
        setAddonToDelete(null);
    };

    const handleToggleAddon = async (addon: Addon) => {
        await toggleAddonMutation.mutateAsync({ addonId: addon.id, enabled: !addon.enabled });
        toast.success(`${addon.enabled ? "Disabled" : "Enabled"} ${addon.name} addon`);
    };

    const handleMoveUp = async (addon: Addon) => {
        const currentIndex = sortedAddons.findIndex((a) => a.id === addon.id);

        if (currentIndex > 0) {
            const updates = [
                { id: sortedAddons[currentIndex].id, order: currentIndex - 1 },
                { id: sortedAddons[currentIndex - 1].id, order: currentIndex },
            ];
            await updateOrdersMutation.mutateAsync(updates);
        }
    };

    const handleMoveDown = async (addon: Addon) => {
        const currentIndex = sortedAddons.findIndex((a) => a.id === addon.id);

        if (currentIndex < sortedAddons.length - 1) {
            const updates = [
                { id: sortedAddons[currentIndex].id, order: currentIndex + 1 },
                { id: sortedAddons[currentIndex + 1].id, order: currentIndex },
            ];
            await updateOrdersMutation.mutateAsync(updates);
        }
    };

    return (
        <div className="mx-auto w-full max-w-4xl space-y-8 pb-16">
            <PageHeader
                icon={Puzzle}
                title="Stremio Addons"
                description="Manage your Stremio addons to fetch sources from multiple providers"
                action={
                    <Button onClick={handleRefresh} disabled={isRefreshing || isLoading} variant="outline">
                        <RefreshCw className={`size-4 ${isRefreshing ? "animate-spin" : ""}`} />
                        Refresh
                    </Button>
                }
            />

            {/* Add New Addon Section */}
            <section className="space-y-4">
                <SectionDivider label="Add Addon" />

                {!isAdding ? (
                    <div className="grid gap-4 sm:grid-cols-2">
                        {/* Custom addon card */}
                        <button
                            onClick={() => setIsAdding(true)}
                            className="group relative flex flex-col items-center justify-center gap-3 rounded-sm border border-dashed border-border/50 p-6 text-center transition-all duration-300 hover:border-primary/50 hover:bg-muted/30">
                            <div className="flex h-12 w-12 items-center justify-center rounded-sm bg-muted/50 transition-colors group-hover:bg-primary/10">
                                <Plus className="size-5 text-muted-foreground transition-colors group-hover:text-primary" />
                            </div>
                            <div>
                                <p className="text-sm font-light">Add Custom Addon</p>
                                <p className="text-xs text-muted-foreground mt-1">Enter a Stremio addon URL</p>
                            </div>
                        </button>

                        {/* Torrentio preset card */}
                        <button
                            onClick={() => handleAddAddon(DEFAULT_ADDON_MANIFEST)}
                            disabled={validating}
                            className="group relative flex flex-col items-center justify-center gap-3 rounded-sm border border-border/50 p-6 text-center transition-all duration-300 hover:border-primary/50 hover:bg-muted/30 disabled:opacity-50 disabled:cursor-not-allowed">
                            <div className="flex h-12 w-12 items-center justify-center rounded-sm bg-muted/50 transition-colors group-hover:bg-primary/10">
                                {validating ? (
                                    <Loader2 className="size-5 text-muted-foreground animate-spin" />
                                ) : (
                                    <Puzzle className="size-5 text-muted-foreground transition-colors group-hover:text-primary" />
                                )}
                            </div>
                            <div>
                                <p className="text-sm font-light">
                                    {validating ? "Adding Torrentio..." : "Add Torrentio"}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">Popular multi-source addon</p>
                            </div>
                        </button>
                    </div>
                ) : (
                    <div className="rounded-sm border border-border/50 overflow-hidden">
                        <div className="bg-muted/30 px-4 py-3 border-b border-border/50">
                            <p className="text-xs tracking-wider uppercase text-muted-foreground">Custom Addon URL</p>
                        </div>
                        <div className="p-4 space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="addon-url" className="sr-only">
                                    Addon URL
                                </Label>
                                <Input
                                    id="addon-url"
                                    type="url"
                                    placeholder="https://addon.example.com/manifest.json"
                                    value={newAddonUrl}
                                    onChange={(e) => setNewAddonUrl(e.target.value)}
                                    disabled={validating}
                                    className="font-mono text-sm"
                                    autoFocus
                                />
                                <p className="text-xs text-muted-foreground">
                                    The URL will be validated by fetching the addon manifest
                                </p>
                            </div>
                            <div className="flex gap-2 pt-2">
                                <Button onClick={() => handleAddAddon()} disabled={validating || !newAddonUrl.trim()}>
                                    {validating ? (
                                        <>
                                            <Loader2 className="size-4 animate-spin" />
                                            Validating...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle2 className="size-4" />
                                            Add Addon
                                        </>
                                    )}
                                </Button>
                                <Button
                                    variant="ghost"
                                    onClick={() => {
                                        setIsAdding(false);
                                        setNewAddonUrl("");
                                    }}
                                    disabled={validating}>
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </section>

            {/* Addons List Section */}
            <section className="space-y-4">
                <SectionDivider label="Your Addons" />

                <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                        {isLoading
                            ? "Loading..."
                            : sortedAddons.length === 0
                              ? "No addons configured yet"
                              : `${sortedAddons.filter((a) => a.enabled).length} of ${sortedAddons.length} addon(s) enabled`}
                    </p>
                </div>

                {isLoading ? (
                    <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                            <AddonCardSkeleton key={i} />
                        ))}
                    </div>
                ) : sortedAddons.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <p className="text-sm font-light text-foreground">No addons added yet</p>
                        <p className="text-xs text-muted-foreground mt-1">
                            Add your first addon to start fetching sources
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {sortedAddons.map((addon, index) => (
                            <AddonCard
                                key={addon.id}
                                addon={addon}
                                onToggle={handleToggleAddon}
                                onRemove={handleRemoveAddon}
                                onMoveUp={handleMoveUp}
                                onMoveDown={handleMoveDown}
                                isFirst={index === 0}
                                isLast={index === sortedAddons.length - 1}
                            />
                        ))}
                    </div>
                )}
            </section>

            {/* Info Section */}
            <section className="space-y-4">
                <SectionDivider label="Information" />

                <div className="rounded-sm border border-border/50 p-4 space-y-3">
                    <div className="flex items-start gap-3">
                        <Info className="size-4 text-muted-foreground shrink-0 mt-0.5" />
                        <div className="space-y-2 text-xs text-muted-foreground">
                            <p>
                                Stremio addons follow a standard protocol. Sources from all enabled addons will be
                                merged and displayed together in the order listed above. Use the arrow buttons to
                                reorder addons.
                            </p>
                            <p>
                                <strong className="text-foreground">Cached sources</strong> (marked with <CachedBadge />
                                ) are detected by checking if the source name contains &quot;instant&quot; or
                                &quot;+&quot;, or if the name/description includes checkmark or lightning emojis. Cached
                                sources are instantly available for download from your debrid service.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                open={!!addonToDelete}
                onOpenChange={(open) => !open && setAddonToDelete(null)}
                title="Remove Addon"
                description={`Are you sure you want to remove "${addonToDelete?.name}"? This action cannot be undone.`}
                confirmText="Remove"
                cancelText="Cancel"
                variant="destructive"
                onConfirm={confirmRemoveAddon}
            />
        </div>
    );
}
