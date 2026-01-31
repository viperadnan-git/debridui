import { Settings } from "lucide-react";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "../ui/dialog";
import { useSettingsStore } from "@/lib/stores/settings";
import { Switch } from "../ui/switch";
import { Label } from "../ui/label";
import { Button } from "../ui/button";

export function QuickSettings() {
    const { get, set, resetKey } = useSettingsStore();
    const smartOrder = get("smartOrder");
    const hideTrash = get("hideTrash");

    const handleReset = () => {
        resetKey("smartOrder");
        resetKey("hideTrash");
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Settings className="size-4 cursor-pointer text-muted-foreground hover:text-foreground hover:rotate-45 transition-all duration-300" />
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="font-light">Quick Settings</DialogTitle>
                </DialogHeader>
                <DialogDescription asChild>
                    <div className="flex flex-col gap-4 py-4">
                        <div className="flex items-center justify-between py-2 border-b border-border/50">
                            <Label htmlFor="smart-order" className="text-sm text-foreground">
                                Smart Order
                            </Label>
                            <Switch
                                id="smart-order"
                                checked={smartOrder}
                                onCheckedChange={(checked) => set("smartOrder", checked)}
                            />
                        </div>
                        <div className="flex items-center justify-between py-2">
                            <Label htmlFor="hide-trash" className="text-sm text-foreground">
                                Hide Trash
                            </Label>
                            <Switch
                                id="hide-trash"
                                checked={hideTrash}
                                onCheckedChange={(checked) => set("hideTrash", checked)}
                            />
                        </div>
                    </div>
                </DialogDescription>
                <DialogFooter className="flex flex-row justify-end gap-2">
                    <Button variant="outline" onClick={handleReset}>
                        Reset
                    </Button>
                    <DialogClose asChild>
                        <Button>Done</Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
