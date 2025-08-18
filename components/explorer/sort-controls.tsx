"use client";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ChevronUp, ChevronDown } from "lucide-react";
import { SORT_OPTIONS } from "@/lib/utils/file";
import { useShallow } from "zustand/react/shallow";
import { useFileStore } from "@/lib/stores/files";

export function SortControls() {
    const { sortBy, sortOrder, setSortBy, setSortOrder } = useFileStore(
        useShallow((state) => ({
            sortBy: state.sortBy,
            sortOrder: state.sortOrder,
            setSortBy: state.setSortBy,
            setSortOrder: state.setSortOrder,
        }))
    );

    const handleSortChange = (newSortBy: string) => {
        setSortBy(newSortBy);
        setSortOrder(newSortBy === "date" ? "desc" : "asc");
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
            <Button
                variant="outline"
                size="sm"
                onClick={() =>
                    setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                }
                className="px-2">
                {sortOrder === "desc" ? (
                    <ChevronDown className="size-4" />
                ) : (
                    <ChevronUp className="size-4" />
                )}
            </Button>
        </div>
    );
}
