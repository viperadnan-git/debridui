"use client";

import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cache, Fragment, memo } from "react";

const pathLabels: Record<string, string> = {
    dashboard: "Dashboard",
    files: "Files",
    settings: "Settings",
};

const formatLabel = cache((label: string) => {
    const cleanedLabel = label.replace(/-/g, " ");
    return cleanedLabel
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
});

export const Breadcrumbs = memo(function Breadcrumbs() {
    const pathname = usePathname();
    const segments = pathname.split("/").filter((segment) => segment !== "");

    if (segments.length === 0) return null;

    // If on dashboard, just show "Home"
    if (pathname === "/dashboard") {
        return (
            <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbPage>Home</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>
        );
    }

    // Check if it's a movie or show page (has 2 segments where first is movies/shows)
    const isMediaPage = segments.length === 2 && (segments[0] === "movies" || segments[0] === "shows");

    return (
        <Breadcrumb>
            <BreadcrumbList>
                <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                        <Link href="/dashboard">Home</Link>
                    </BreadcrumbLink>
                </BreadcrumbItem>
                {segments.map((segment, index) => {
                    const isLast = index === segments.length - 1;
                    const href = "/" + segments.slice(0, index + 1).join("/");

                    // Skip dashboard segment if it appears in the path
                    if (segment === "dashboard") {
                        return null;
                    }

                    // For media pages, only show the type (movie/show), not the slug
                    if (isMediaPage && index === 1) {
                        return null;
                    }

                    let label = pathLabels[segment] || formatLabel(segment);

                    // Capitalize movies/shows for display
                    if (segment === "movies") label = "Movie";
                    if (segment === "shows") label = "TV Show";

                    return (
                        <Fragment key={segment + index}>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                {isLast || isMediaPage ? (
                                    <BreadcrumbPage>{label}</BreadcrumbPage>
                                ) : (
                                    <BreadcrumbLink asChild>
                                        <Link href={href}>{label}</Link>
                                    </BreadcrumbLink>
                                )}
                            </BreadcrumbItem>
                        </Fragment>
                    );
                })}
            </BreadcrumbList>
        </Breadcrumb>
    );
});
