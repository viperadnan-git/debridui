"use client";

import { Search as SearchIcon } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { SearchContent } from "@/components/mdb/search-content";

export default function SearchPage() {
    return (
        <div className="mx-auto w-full max-w-5xl space-y-8 pb-16">
            <PageHeader icon={SearchIcon} title="Search" description="Search movies, TV shows, and files" />
            <SearchContent variant="page" autoFocus />
        </div>
    );
}
