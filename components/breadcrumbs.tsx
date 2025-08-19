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
    movie: "Movie",
    show: "Show",
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
    const blacklist = ["", "movie", "show"];
    const segments = pathname.split("/").filter((segment) => !blacklist.includes(segment));

    if (segments.length === 0) return null;

    return (
        <Breadcrumb>
            <BreadcrumbList>
                {pathname !== "/dashboard" && (
                    <BreadcrumbItem>
                        <BreadcrumbLink className="text-foreground" asChild>
                            <Link href="/dashboard">Home</Link>
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                )}
                {segments.map((segment, index) => {
                    const isLast = index === segments.length - 1;
                    const href = "/" + segments.slice(0, index + 1).join("/");
                    const label = pathLabels[segment] || formatLabel(segment);

                    if (segment === "dashboard" && index === 0) {
                        return null;
                    }

                    return (
                        <Fragment key={segment + index}>
                            <BreadcrumbSeparator className="text-foreground" />
                            <BreadcrumbItem>
                                {isLast ? (
                                    <BreadcrumbPage>{label}</BreadcrumbPage>
                                ) : (
                                    <BreadcrumbLink className="text-foreground" asChild>
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
