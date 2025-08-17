"use client";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ChevronUp, ChevronDown } from "lucide-react";

export type SortOption = {
    value: string;
    label: string;
};

interface SortControlsProps {
    sortBy: string;
    sortDirection: "asc" | "desc";
    sortOptions: SortOption[];
    onSortChange: (sortBy: string) => void;
    onDirectionToggle: () => void;
}

export function SortControls({
    sortBy,
    sortDirection,
    sortOptions,
    onSortChange,
    onDirectionToggle,
}: SortControlsProps) {
    return (
        <div className="flex items-center gap-2">
            <Select value={sortBy} onValueChange={onSortChange}>
                <SelectTrigger className="w-[180px]" id="sort-select">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    {sortOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                            {option.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <Button
                variant="outline"
                size="sm"
                onClick={onDirectionToggle}
                className="px-2"
            >
                {sortDirection === "desc" ? (
                    <ChevronDown className="size-4" />
                ) : (
                    <ChevronUp className="size-4" />
                )}
            </Button>
        </div>
    );
}
