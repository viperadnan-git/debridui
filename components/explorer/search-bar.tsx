"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";

interface SearchBarProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    onSubmit?: (value: string) => void;
}

export function SearchBar({ value, onChange, placeholder = "Search files...", onSubmit }: SearchBarProps) {
    return (
        <div className="flex-1 relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="px-10 text-sm"
                onKeyDown={(e) => {
                    if (e.key === "Enter") {
                        onSubmit?.(value);
                    }
                }}
            />
            {value && (
                <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                    onClick={() => onChange("")}>
                    <X className="h-3 w-3" />
                </Button>
            )}
        </div>
    );
}
