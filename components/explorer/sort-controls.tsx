"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArrowUpDown, ChevronDown, ChevronUp } from "lucide-react";
import { SORT_OPTIONS } from "@/lib/utils/file";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useCallback } from "react";

export function SortControls() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const sortBy = searchParams.get("sort_by") || "date";
    const sortOrder = (searchParams.get("sort_order") as "asc" | "desc") || "desc";
    const isDefault = sortBy === "date" && sortOrder === "desc";
    const currentLabel = SORT_OPTIONS.find((o) => o.value === sortBy)?.label ?? "Sort";

    const searchParamsString = searchParams.toString();
    const updateURLParams = useCallback(
        (newSortBy: string, newSortOrder: "asc" | "desc") => {
            const params = new URLSearchParams(searchParamsString);
            params.set("sort_by", newSortBy);
            params.set("sort_order", newSortOrder);
            router.push(`${pathname}?${params.toString()}`);
        },
        [searchParamsString, pathname, router]
    );

    const handleSortChange = (newSortBy: string) => updateURLParams(newSortBy, sortOrder);
    const handleOrderChange = () => updateURLParams(sortBy, sortOrder === "asc" ? "desc" : "asc");

    return (
        <>
            {/* Mobile: compact dropdown trigger */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="outline"
                        size="icon"
                        aria-label={`Sort: ${currentLabel}, ${sortOrder === "asc" ? "ascending" : "descending"}`}
                        className="sm:hidden relative size-9 border-border/50 group">
                        <ArrowUpDown className="size-4 transition-transform duration-300 group-data-[state=open]:rotate-180" />
                        {!isDefault && (
                            <span
                                aria-hidden
                                className="absolute top-1 right-1 size-1.5 rounded-full bg-primary animate-in fade-in-0 zoom-in-50 duration-200"
                            />
                        )}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" sideOffset={6} className="w-44">
                    <DropdownMenuGroup>
                        <DropdownMenuLabel className="py-1 text-[10px] tracking-widest uppercase text-muted-foreground font-light">
                            Sort by
                        </DropdownMenuLabel>
                        <DropdownMenuRadioGroup value={sortBy} onValueChange={handleSortChange}>
                            {SORT_OPTIONS.map((option) => (
                                <DropdownMenuRadioItem
                                    key={option.value}
                                    value={option.value}
                                    className="py-1 text-xs cursor-pointer">
                                    {option.label}
                                </DropdownMenuRadioItem>
                            ))}
                        </DropdownMenuRadioGroup>
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                        <DropdownMenuLabel className="py-1 text-[10px] tracking-widest uppercase text-muted-foreground font-light">
                            Order
                        </DropdownMenuLabel>
                        <DropdownMenuRadioGroup
                            value={sortOrder}
                            onValueChange={(v) => updateURLParams(sortBy, v as "asc" | "desc")}>
                            <DropdownMenuRadioItem value="desc" className="py-1 text-xs cursor-pointer">
                                <ChevronDown className="text-muted-foreground" />
                                Descending
                            </DropdownMenuRadioItem>
                            <DropdownMenuRadioItem value="asc" className="py-1 text-xs cursor-pointer">
                                <ChevronUp className="text-muted-foreground" />
                                Ascending
                            </DropdownMenuRadioItem>
                        </DropdownMenuRadioGroup>
                    </DropdownMenuGroup>
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Desktop: inline Select + direction toggle */}
            <div className="hidden sm:flex items-center gap-2 shrink-0">
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
                <Button
                    variant="outline"
                    size="icon"
                    onClick={handleOrderChange}
                    aria-label={`Order: ${sortOrder === "asc" ? "ascending" : "descending"}`}
                    className="size-9 border-border/50 overflow-hidden">
                    <span key={sortOrder} className="inline-flex animate-in fade-in-0 zoom-in-90 duration-200">
                        {sortOrder === "desc" ? <ChevronDown className="size-4" /> : <ChevronUp className="size-4" />}
                    </span>
                </Button>
            </div>
        </>
    );
}
