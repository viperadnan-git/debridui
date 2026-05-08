"use client";

import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface SearchBarProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    onSubmit?: (value: string) => void;
}

export function SearchBar({ value, onChange, placeholder = "Search files...", onSubmit }: SearchBarProps) {
    const hasValue = value.length > 0;
    return (
        <div className="flex-1 relative min-w-0 group">
            <Search
                className={`absolute left-3 top-1/2 -translate-y-1/2 size-4 transition-colors duration-200 ${
                    hasValue ? "text-foreground" : "text-muted-foreground group-focus-within:text-foreground"
                }`}
            />
            <Input
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="pl-10 pr-9 text-sm border-border/50 bg-transparent transition-[box-shadow,border-color] duration-200"
                onKeyDown={(e) => {
                    if (e.key === "Enter") {
                        onSubmit?.(value);
                    }
                }}
            />
            {hasValue && (
                <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Clear search"
                    className="absolute right-1 top-1/2 -translate-y-1/2 size-7 text-muted-foreground hover:text-foreground animate-in fade-in-0 zoom-in-90 duration-200"
                    onClick={() => onChange("")}>
                    <X className="size-3.5" />
                </Button>
            )}
        </div>
    );
}
