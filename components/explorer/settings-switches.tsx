"use client";

import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useSettingsStore } from "@/lib/stores/settings";
import { cn } from "@/lib/utils";

export function SettingsSwitches({ className }: { className?: string }) {
    const { smartOrder, hideTrash, setSmartOrder, setHideTrash } =
        useSettingsStore();

    return (
        <div className={cn("flex flex-wrap items-center gap-4", className)}>
            <div className="flex items-center gap-2">
                <Switch
                    id="smart-order"
                    checked={smartOrder}
                    onCheckedChange={setSmartOrder}
                    className="max-sm:h-2 data-[state=checked]:bg-primary/50"
                />
                <Label htmlFor="smart-order" className="text-sm">
                    Smart Order
                </Label>
            </div>
            <div className="flex items-center gap-2">
                <Switch
                    id="hide-trash"
                    checked={hideTrash}
                    onCheckedChange={setHideTrash}
                    className="max-sm:h-2 data-[state=checked]:bg-primary/50"
                />
                <Label htmlFor="hide-trash" className="text-sm">
                    Hide Trash
                </Label>
            </div>
        </div>
    );
}
