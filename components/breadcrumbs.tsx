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
import { Fragment, memo, useMemo } from "react";

// Routes with dynamic [slug] that should show singular label and hide the slug
const DETAIL_ROUTES: Record<string, string> = {
    movies: "Movie",
    shows: "TV Show",
    people: "People",
};

// Static route labels
const ROUTE_LABELS: Record<string, string> = {
    dashboard: "Dashboard",
    files: "Files",
    settings: "Settings",
    accounts: "Accounts",
    addons: "Addons",
    search: "Search",
    help: "Help",
    links: "Links",
};

const formatSegment = (segment: string): string => {
    return segment
        .replace(/-/g, " ")
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
};

export const Breadcrumbs = memo(function Breadcrumbs() {
    const pathname = usePathname();

    const breadcrumbs = useMemo(() => {
        const segments = pathname.split("/").filter(Boolean);

        if (segments.length === 0 || pathname === "/dashboard") {
            return [{ label: "Home", href: null }];
        }

        const items: Array<{ label: string; href: string | null }> = [{ label: "Home", href: "/dashboard" }];

        // Check if this is a detail page (e.g., /movies/[slug], /people/[slug])
        const isDetailPage = segments.length === 2 && segments[0] in DETAIL_ROUTES;

        for (let i = 0; i < segments.length; i++) {
            const segment = segments[i];

            // Skip dashboard in path
            if (segment === "dashboard") continue;

            // For detail pages, skip the slug segment and use singular label
            if (isDetailPage) {
                if (i === 0) {
                    items.push({ label: DETAIL_ROUTES[segment], href: null });
                }
                // Skip the slug (i === 1)
                continue;
            }

            // Regular segment
            const href = "/" + segments.slice(0, i + 1).join("/");
            const label = ROUTE_LABELS[segment] || formatSegment(segment);
            const isLast = i === segments.length - 1;

            items.push({ label, href: isLast ? null : href });
        }

        return items;
    }, [pathname]);

    return (
        <Breadcrumb>
            <BreadcrumbList>
                {breadcrumbs.map((item, index) => (
                    <Fragment key={index}>
                        {index > 0 && <BreadcrumbSeparator />}
                        <BreadcrumbItem>
                            {item.href ? (
                                <BreadcrumbLink asChild>
                                    <Link href={item.href}>{item.label}</Link>
                                </BreadcrumbLink>
                            ) : (
                                <BreadcrumbPage>{item.label}</BreadcrumbPage>
                            )}
                        </BreadcrumbItem>
                    </Fragment>
                ))}
            </BreadcrumbList>
        </Breadcrumb>
    );
});
