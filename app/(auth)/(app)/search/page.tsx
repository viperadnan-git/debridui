"use client";

import { useSearchParams } from "next/navigation";
import { SearchContent } from "@/components/mdb/search-content";

export default function SearchPage() {
    const searchParams = useSearchParams();
    const initialQuery = searchParams.get("q") ?? "";

    return (
        <div className="mx-auto w-full lg:max-w-5xl pb-16">
            {/* Editorial header */}
            <header className="pt-1 sm:pt-2 pb-3 sm:pb-4 space-y-1.5 sm:space-y-2">
                <div className="flex items-center gap-2.5">
                    <span className="h-px w-5 sm:w-6 bg-primary" />
                </div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-light leading-tight">Search</h1>
                <p className="text-xs sm:text-sm text-muted-foreground max-w-xl">
                    Movies, TV shows, your debrid files
                    <span className="hidden sm:inline">, and stream sources </span>
                    <span className="sm:hidden">, sources</span> — all in one place.
                </p>
            </header>

            <SearchContent variant="page" autoFocus defaultQuery={initialQuery} className="space-y-8 sm:space-y-10" />
        </div>
    );
}
