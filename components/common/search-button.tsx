"use client";

import { memo } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSearch } from "@/components/mdb/search-provider";
import { cn } from "@/lib/utils";

interface SearchButtonProps {
    className?: string;
}

export const SearchButton = memo(function SearchButton({ className }: SearchButtonProps) {
    const { setOpen } = useSearch();

    return (
        <Button
            variant="ghost"
            size="sm"
            onClick={() => setOpen(true)}
            className={cn("text-muted-foreground hover:text-foreground", className)}>
            <Search className="size-4" />
            <span className="hidden sm:inline ml-2">Search</span>
            <kbd className="hidden md:inline-flex ml-2 px-1.5 py-0.5 text-[10px] font-medium tracking-wide bg-muted/50 rounded">
                ⌘K
            </kbd>
        </Button>
    );
});
