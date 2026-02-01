"use client";

import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
    BreadcrumbEllipsis,
} from "@/components/ui/breadcrumb";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment, memo, useMemo } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

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

const ITEMS_TO_DISPLAY_MOBILE = 2;
const ITEMS_TO_DISPLAY_DESKTOP = 3;

export const Breadcrumbs = memo(function Breadcrumbs() {
    const pathname = usePathname();
    const isMobile = useIsMobile();
    const ITEMS_TO_DISPLAY = isMobile ? ITEMS_TO_DISPLAY_MOBILE : ITEMS_TO_DISPLAY_DESKTOP;

    const items = useMemo(() => {
        const segments = pathname.split("/").filter(Boolean);

        if (segments.length === 0 || pathname === "/dashboard") {
            return [{ label: "Home", href: null }];
        }

        const breadcrumbs: Array<{ label: string; href: string | null }> = [{ label: "Home", href: "/dashboard" }];

        // Check if this is a detail page (e.g., /movies/[slug], /people/[slug])
        const isDetailPage = segments.length === 2 && segments[0] in DETAIL_ROUTES;

        for (let i = 0; i < segments.length; i++) {
            const segment = segments[i];

            // Skip dashboard in path
            if (segment === "dashboard") continue;

            // For detail pages, skip the slug segment and use singular label
            if (isDetailPage) {
                if (i === 0) {
                    breadcrumbs.push({ label: DETAIL_ROUTES[segment], href: null });
                }
                // Skip the slug (i === 1)
                continue;
            }

            // Regular segment
            const href = "/" + segments.slice(0, i + 1).join("/");
            const label = ROUTE_LABELS[segment] || formatSegment(segment);
            const isLast = i === segments.length - 1;

            breadcrumbs.push({ label, href: isLast ? null : href });
        }

        return breadcrumbs;
    }, [pathname]);

    const showEllipsis = items.length > ITEMS_TO_DISPLAY;
    const hiddenItems = showEllipsis ? items.slice(1, -(ITEMS_TO_DISPLAY - 1)) : [];
    const tailItems = showEllipsis ? items.slice(-(ITEMS_TO_DISPLAY - 1)) : items.slice(1);

    return (
        <Breadcrumb className="min-w-0">
            <BreadcrumbList className="flex-nowrap">
                <BreadcrumbItem>
                    {items.length === 1 ? (
                        <BreadcrumbPage>{items[0].label}</BreadcrumbPage>
                    ) : (
                        <BreadcrumbLink asChild>
                            <Link href={items[0].href ?? "/dashboard"}>{items[0].label}</Link>
                        </BreadcrumbLink>
                    )}
                </BreadcrumbItem>
                {tailItems.length > 0 && <BreadcrumbSeparator />}
                {showEllipsis && (
                    <>
                        <BreadcrumbItem>
                            <DropdownMenu>
                                <DropdownMenuTrigger className="flex items-center gap-1" aria-label="Toggle menu">
                                    <BreadcrumbEllipsis className="size-4" />
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start">
                                    {hiddenItems.map((item, index) => (
                                        <DropdownMenuItem key={index} asChild>
                                            <Link href={item.href ?? "#"}>{item.label}</Link>
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                    </>
                )}
                {tailItems.map((item, index, arr) => (
                    <Fragment key={index}>
                        <BreadcrumbItem>
                            {item.href ? (
                                <BreadcrumbLink asChild className="max-w-40 truncate md:max-w-none">
                                    <Link href={item.href}>{item.label}</Link>
                                </BreadcrumbLink>
                            ) : (
                                <BreadcrumbPage className="max-w-40 truncate md:max-w-none">
                                    {item.label}
                                </BreadcrumbPage>
                            )}
                        </BreadcrumbItem>
                        {index < arr.length - 1 && <BreadcrumbSeparator />}
                    </Fragment>
                ))}
            </BreadcrumbList>
        </Breadcrumb>
    );
});
