"use client";

import { useState, useMemo, useCallback } from "react";
import { useUserAddons, useAddAddon, useRemoveAddon, useToggleAddon, useUpdateAddonOrders } from "@/hooks/use-addons";
import { AddonClient } from "@/lib/addons/client";
import { type Addon } from "@/lib/addons/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import { Plus, Loader2, CheckCircle2, AlertCircle, Puzzle, Info, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { AddonCard } from "@/components/addon-card";
import { CachedBadge } from "@/components/display";
import { ConfirmDialog } from "@/components/confirm-dialog";

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

    if (isLoading) {
        return (
            <div className="container mx-auto max-w-5xl space-y-8 pb-16">
                <PageHeader
                    icon={Puzzle}
                    title="Stremio Addons"
                    description="Manage your Stremio addons to fetch sources from multiple providers"
                />
                <Card>
                    <CardContent className="py-12">
                        <div className="flex items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="container mx-auto max-w-5xl space-y-8 pb-16">
            <PageHeader
                icon={Puzzle}
                title="Stremio Addons"
                description="Manage your Stremio addons to fetch sources from multiple providers"
                action={
                    <Button
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        variant="outline"
                        size="sm"
                        className="w-full sm:w-auto">
                        <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
                        Refresh
                    </Button>
                }
            />

            {/* Settings Grid */}
            <div className="grid gap-6 md:grid-cols-2">
                {/* Add New Addon */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10">
                                <Plus className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <CardTitle>Add New Addon</CardTitle>
                                <CardDescription>Enter a Stremio addon URL</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {!isAdding ? (
                            <div className="flex flex-col gap-2 md:flex-row">
                                <Button onClick={() => setIsAdding(true)} variant="default" className="gap-2">
                                    <Plus className="h-4 w-4" />
                                    Add Addon
                                </Button>
                                <Button
                                    onClick={() => handleAddAddon(DEFAULT_ADDON_MANIFEST)}
                                    variant="outline"
                                    className="gap-2"
                                    disabled={validating}>
                                    {validating ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Adding...
                                        </>
                                    ) : (
                                        <>
                                            <Puzzle className="h-4 w-4" />
                                            Add Torrentio
                                        </>
                                    )}
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="space-y-3">
                                    <Label htmlFor="addon-url" className="text-sm font-medium">
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
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        The URL will be validated by fetching the addon manifest
                                    </p>
                                </div>
                                <div className="flex flex-col md:flex-row gap-2">
                                    <Button
                                        onClick={() => handleAddAddon()}
                                        disabled={validating || !newAddonUrl.trim()}
                                        size="sm"
                                        className="gap-2">
                                        {validating ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                Validating...
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle2 className="h-4 w-4" />
                                                Add Addon
                                            </>
                                        )}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            setIsAdding(false);
                                            setNewAddonUrl("");
                                        }}
                                        disabled={validating}>
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Addons List */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10">
                                <Puzzle className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <CardTitle>Your Addons</CardTitle>
                                <CardDescription>
                                    {sortedAddons.length === 0
                                        ? "No addons configured yet"
                                        : `${sortedAddons.filter((a) => a.enabled).length} of ${sortedAddons.length} addon(s) enabled`}
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {sortedAddons.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
                                    <AlertCircle className="h-6 w-6 text-muted-foreground" />
                                </div>
                                <p className="font-medium">No addons added yet</p>
                                <p className="text-sm text-muted-foreground mt-1">
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
                    </CardContent>
                </Card>

                {/* Info Alert */}
                <Alert className="md:col-span-2">
                    <Info className="h-4 w-4" />
                    <AlertTitle>About Stremio Addons</AlertTitle>
                    <AlertDescription className="space-y-2">
                        <p>
                            Stremio addons follow a standard protocol. Sources from all enabled addons will be merged
                            and displayed together in the order listed above. Use the arrow buttons to reorder addons.
                        </p>
                        <p>
                            <strong>Cached sources</strong> (marked with <CachedBadge />) are detected by checking if
                            the source name contains &quot;instant&quot; or &quot;+&quot;, or if the name/description
                            includes ✅ or ⚡ emojis. Cached sources are instantly available for download from your
                            debrid service.
                        </p>
                    </AlertDescription>
                </Alert>
            </div>

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
