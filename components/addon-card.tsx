"use client";

import { type Addon } from "@/lib/addons/types";
import { useAddon } from "@/hooks/use-addon";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Puzzle, Trash2, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface AddonCardProps {
    addon: Addon;
    onToggle: (addon: Addon) => void;
    onRemove: (addon: Addon) => void;
}

export function AddonCard({ addon, onToggle, onRemove }: AddonCardProps) {
    const { data: manifest, isLoading } = useAddon({ url: addon.url });

    return (
        <div
            className={cn(
                "rounded-lg border p-4 transition-colors space-y-3",
                addon.enabled ? "bg-card" : "bg-muted/30"
            )}>
            {/* Row 1: Icon + Name/Version */}
            <div className="flex gap-3 items-start">
                {/* Column 1: Icon */}
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border bg-muted/50 overflow-hidden">
                    {isLoading ? (
                        <Skeleton className="h-full w-full rounded-md" />
                    ) : manifest?.logo ? (
                        <img src={manifest.logo} alt={addon.name} className="h-full w-full object-contain p-1" />
                    ) : (
                        <Puzzle className="h-6 w-6 text-muted-foreground" />
                    )}
                </div>

                {/* Column 2: Name + Version Badge */}
                <div className="flex-1 min-w-0">
                    <div className="flex flex-col gap-1">
                        <h3 className="font-semibold truncate min-w-0">{addon.name}</h3>
                        {isLoading ? (
                            <Skeleton className="h-4 w-12" />
                        ) : (
                            manifest?.version && (
                                <Badge variant="outline" className="text-[10px] shrink-0">
                                    v{manifest.version}
                                </Badge>
                            )
                        )}
                    </div>
                </div>
            </div>

            {/* Row 2: Description */}
            {isLoading ? (
                <div className="space-y-2">
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-4/5" />
                </div>
            ) : (
                manifest?.description && (
                    <p className="text-sm text-muted-foreground line-clamp-4 md:line-clamp-3 lg:line-clamp-2 whitespace-pre-wrap break-all">
                        {manifest.description}
                    </p>
                )
            )}

            {/* Row 3: Actions */}
            <div className="flex items-center justify-between gap-3 pt-3 border-t flex-wrap">
                <div className="flex items-center gap-2">
                    <Switch id={`toggle-${addon.id}`} checked={addon.enabled} onCheckedChange={() => onToggle(addon)} />
                    <Label htmlFor={`toggle-${addon.id}`} className="text-sm cursor-pointer whitespace-nowrap">
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
                        onClick={() => onRemove(addon)}
                        className="h-9 w-9 text-destructive hover:text-destructive hover:bg-destructive/10">
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
