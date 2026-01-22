"use client";

import { CommandDialog } from "@/components/ui/command";
import { SearchContent } from "./search-content";

interface SearchDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
    const handleClose = () => {
        onOpenChange(false);
    };

    return (
        <CommandDialog
            open={open}
            onOpenChange={onOpenChange}
            shouldFilter={false}
            className="w-11/12 sm:w-5/6 sm:max-w-none md:max-w-2xl lg:max-w-4xl p-0">
            <SearchContent variant="modal" onClose={handleClose} />
        </CommandDialog>
    );
}
