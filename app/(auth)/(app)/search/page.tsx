"use client";

import { Search } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { SearchContent } from "@/components/mdb/search-content";
import { PageHeader } from "@/components/page-header";

function SearchPageContent() {
    const searchParams = useSearchParams();
    const initialQuery = searchParams.get("q") ?? "";

    return <SearchContent variant="page" autoFocus defaultQuery={initialQuery} className="space-y-8 sm:space-y-10" />;
}

export default function SearchPage() {
    return (
        <div className="mx-auto w-full max-w-4xl pb-16 space-y-4 sm:space-y-6 lg:space-y-8">
            <PageHeader
                icon={Search}
                title="Search"
                description={
                    <>
                        Movies, TV shows, your debrid files
                        <span className="hidden sm:inline">, and stream sources </span>
                        <span className="sm:hidden">, sources</span> — all in one place.
                    </>
                }
            />
            <Suspense fallback={null}>
                <SearchPageContent />
            </Suspense>
        </div>
    );
}
