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
import { useShallow } from "zustand/react/shallow";
import { Switch } from "../ui/switch";
import { Label } from "../ui/label";
import { Button } from "../ui/button";

export function QuickSettings() {
    const { smartOrder, hideTrash, setSmartOrder, setHideTrash } =
        useSettingsStore(
            useShallow((state) => ({
                smartOrder: state.smartOrder,
                hideTrash: state.hideTrash,
                setSmartOrder: state.setSmartOrder,
                setHideTrash: state.setHideTrash,
            }))
        );

    const handleReset = () => {
        setSmartOrder(false);
        setHideTrash(false);
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Settings className="size-4 cursor-pointer hover:rotate-45 transition-transform duration-300" />
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Quick Settings</DialogTitle>
                </DialogHeader>
                <DialogDescription asChild>
                    <div className="flex flex-col gap-4 py-4">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="smart-order" className="text-sm text-foreground">
                                Smart Order
                            </Label>
                            <Switch
                                id="smart-order"
                                checked={smartOrder}
                                onCheckedChange={setSmartOrder}
                                className="data-[state=checked]:bg-primary/50"
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <Label
                                htmlFor="hide-trash"
                                className="text-sm text-foreground">
                                Hide Trash
                            </Label>
                            <Switch
                                id="hide-trash"
                                checked={hideTrash}
                                onCheckedChange={setHideTrash}
                                className="data-[state=checked]:bg-primary/50"
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
