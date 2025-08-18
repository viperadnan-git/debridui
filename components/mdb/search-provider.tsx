"use client";

import { useState, useEffect, createContext, useContext } from "react";
import { SearchDialog } from "./search-dialog";

interface SearchContextType {
    open: boolean;
    setOpen: (open: boolean) => void;
    toggle: () => void;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export function useSearch() {
    const context = useContext(SearchContext);
    if (!context) {
        throw new Error("useSearch must be used within a SearchProvider");
    }
    return context;
}

interface SearchProviderProps {
    children: React.ReactNode;
}

export function SearchProvider({ children }: SearchProviderProps) {
    const [open, setOpen] = useState(false);

    const toggle = () => setOpen((prev) => !prev);

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                toggle();
            }
        };

        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, []);

    return (
        <SearchContext.Provider value={{ open, setOpen, toggle }}>
            {children}
            <SearchDialog open={open} onOpenChange={setOpen} />
        </SearchContext.Provider>
    );
}
