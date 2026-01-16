"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ChevronUp, ChevronDown } from "lucide-react";
import { SORT_OPTIONS } from "@/lib/utils/file";
import { useShallow } from "zustand/react/shallow";
import { useFileStore } from "@/lib/stores/files";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useCallback } from "react";

export function SortControls() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const { sortBy, sortOrder, setSortBy, setSortOrder } = useFileStore(
        useShallow((state) => ({
            sortBy: state.sortBy,
            sortOrder: state.sortOrder,
            setSortBy: state.setSortBy,
            setSortOrder: state.setSortOrder,
        }))
    );

    const updateURLParams = useCallback(
        (newSortBy: string, newSortOrder: "asc" | "desc") => {
            const params = new URLSearchParams(searchParams.toString());
            params.set("sort_by", newSortBy);
            params.set("sort_order", newSortOrder);
            router.push(`${pathname}?${params.toString()}`);
        },
        [searchParams, pathname, router]
    );

    const handleSortChange = (newSortBy: string) => {
        setSortBy(newSortBy);
        updateURLParams(newSortBy, sortOrder);
    };

    const handleOrderChange = () => {
        const newSortOrder = sortOrder === "asc" ? "desc" : "asc";
        setSortOrder(newSortOrder);
        updateURLParams(sortBy, newSortOrder);
    };

    return (
        <div className="flex items-center gap-2">
            <Select value={sortBy} onValueChange={handleSortChange}>
                <SelectTrigger className="w-[180px]" id="sort-select">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    {SORT_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                            {option.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={handleOrderChange} className="px-2">
                {sortOrder === "desc" ? <ChevronDown className="size-4" /> : <ChevronUp className="size-4" />}
            </Button>
        </div>
    );
}
