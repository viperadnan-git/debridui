"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ChevronUp, ChevronDown } from "lucide-react";
import { SORT_OPTIONS } from "@/lib/utils/file";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useCallback } from "react";

export function SortControls() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const sortBy = searchParams.get("sort_by") || "date";
    const sortOrder = (searchParams.get("sort_order") as "asc" | "desc") || "desc";

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
        updateURLParams(newSortBy, sortOrder);
    };

    const handleOrderChange = () => {
        const newSortOrder = sortOrder === "asc" ? "desc" : "asc";
        updateURLParams(sortBy, newSortOrder);
    };

    return (
        <div className="flex items-center gap-2">
            <Select value={sortBy} onValueChange={handleSortChange}>
                <SelectTrigger className="w-[180px] border-border/50" id="sort-select">
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
            <Button variant="outline" size="sm" onClick={handleOrderChange} className="px-2 border-border/50">
                {sortOrder === "desc" ? <ChevronDown className="size-4" /> : <ChevronUp className="size-4" />}
            </Button>
        </div>
    );
}
