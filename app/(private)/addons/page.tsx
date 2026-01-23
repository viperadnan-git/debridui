"use client";

import { useState } from "react";
import { useAddonsStore, DEFAULT_TORRENTIO_URL_PREFIX } from "@/lib/stores/addons";
import { AddonClient } from "@/lib/addons/client";
import { type Addon } from "@/lib/addons/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import { Plus, Trash2, Loader2, CheckCircle2, AlertCircle, Puzzle, Zap, Info, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";

export default function AddonsPage() {
    const { addons, addAddon, removeAddon, toggleAddon } = useAddonsStore();
    const [isAdding, setIsAdding] = useState(false);
    const [newAddonUrl, setNewAddonUrl] = useState("");
    const [validating, setValidating] = useState(false);

    const handleAddAddon = async () => {
        if (!newAddonUrl.trim()) {
            toast.error("Please enter an addon URL");
            return;
        }

        setValidating(true);
        try {
            const client = new AddonClient({ url: newAddonUrl });
            const manifest = await client.fetchManifest();

            addAddon({
                id: manifest.id,
                name: manifest.name,
                url: newAddonUrl,
                enabled: true,
                manifestData: manifest,
            });

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
        removeAddon(addon.id);
        toast.success(`Removed ${addon.name} addon`);
    };

    const handleToggleAddon = (addon: Addon) => {
        toggleAddon(addon.id);
        toast.success(`${addon.enabled ? "Disabled" : "Enabled"} ${addon.name} addon`);
    };

    const handleAddTorrentio = async () => {
        setValidating(true);
        const torrentioUrl = `${DEFAULT_TORRENTIO_URL_PREFIX}/manifest.json`;

        try {
            const exists = addons.some((a) => a.url === torrentioUrl || a.id === "app.stremio.torrentio");
            if (exists) {
                toast.error("Torrentio addon is already added");
                return;
            }

            const client = new AddonClient({ url: torrentioUrl });
            const manifest = await client.fetchManifest();

            addAddon({
                id: manifest.id,
                name: manifest.name,
                url: torrentioUrl,
                enabled: true,
                manifestData: manifest,
            });

            toast.success(`Added ${manifest.name} addon`);
        } catch (error) {
            toast.error(`Failed to add Torrentio: ${error instanceof Error ? error.message : "Unknown error"}`);
        } finally {
            setValidating(false);
        }
    };

    return (
        <div className="container mx-auto max-w-5xl space-y-8 pb-16">
            <PageHeader
                icon={Puzzle}
                title="Stremio Addons"
                description="Manage your Stremio addons to fetch sources from multiple providers"
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
                                    onClick={handleAddTorrentio}
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
                                            <Zap className="h-4 w-4" />
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
                                        onClick={handleAddAddon}
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
                                    {addons.length === 0
                                        ? "No addons configured yet"
                                        : `${addons.filter((a) => a.enabled).length} of ${addons.length} addon(s) enabled`}
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {addons.length === 0 ? (
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
                                {addons.map((addon) => (
                                    <div
                                        key={addon.id}
                                        className={cn(
                                            "rounded-lg border p-4 transition-colors space-y-3",
                                            addon.enabled ? "bg-card" : "bg-muted/30"
                                        )}>
                                        {/* Row 1: Icon + Name/Version */}
                                        <div className="flex gap-3 items-start">
                                            {/* Column 1: Icon */}
                                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border bg-muted/50 overflow-hidden">
                                                {addon.manifestData?.logo ? (
                                                    <img
                                                        src={addon.manifestData.logo}
                                                        alt={addon.name}
                                                        className="h-full w-full object-contain p-1"
                                                    />
                                                ) : (
                                                    <Puzzle className="h-6 w-6 text-muted-foreground" />
                                                )}
                                            </div>

                                            {/* Column 2: Name + Version Badge */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex flex-col gap-1">
                                                    <h3 className="font-semibold truncate min-w-0">{addon.name}</h3>
                                                    {addon.manifestData?.version && (
                                                        <Badge variant="outline" className="text-[10px] shrink-0">
                                                            v{addon.manifestData.version}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Row 2: Description */}
                                        {addon.manifestData?.description && (
                                            <p className="text-sm text-muted-foreground line-clamp-4 md:line-clamp-3 lg:line-clamp-2 whitespace-pre-wrap break-all">
                                                {addon.manifestData.description}
                                            </p>
                                        )}

                                        {/* Row 3: Actions */}
                                        <div className="flex items-center justify-between gap-3 pt-3 border-t flex-wrap">
                                            <div className="flex items-center gap-2">
                                                <Switch
                                                    id={`toggle-${addon.id}`}
                                                    checked={addon.enabled}
                                                    onCheckedChange={() => handleToggleAddon(addon)}
                                                />
                                                <Label
                                                    htmlFor={`toggle-${addon.id}`}
                                                    className="text-sm cursor-pointer whitespace-nowrap">
                                                    {addon.enabled ? "Enabled" : "Disabled"}
                                                </Label>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(addon.url);
                                                        toast.success("Addon URL copied to clipboard");
                                                    }}
                                                    className="h-9 w-9">
                                                    <Share2 className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleRemoveAddon(addon)}
                                                    className="h-9 w-9 text-destructive hover:text-destructive hover:bg-destructive/10">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Info Alert */}
                <Alert className="md:col-span-2">
                    <Info className="h-4 w-4" />
                    <AlertTitle>About Stremio Addons</AlertTitle>
                    <AlertDescription>
                        Stremio addons follow a standard protocol. Sources from all enabled addons will be merged and
                        displayed together. Cached sources (marked with ⚡) are instantly available for download.
                    </AlertDescription>
                </Alert>
            </div>
        </div>
    );
}
