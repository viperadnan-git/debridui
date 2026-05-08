"use client";

import { FolderOpen, HomeIcon, type LucideIcon, MoreHorizontal, SearchIcon, SettingsIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { cn } from "@/lib/utils";
import { MoreSheet } from "./more-sheet";

type Tab =
    | { kind: "link"; key: string; label: string; href: string; icon: LucideIcon; matchPrefix?: string }
    | { kind: "more"; key: string; label: string; icon: LucideIcon };

const TABS: Tab[] = [
    { kind: "link", key: "home", label: "Home", href: "/dashboard", icon: HomeIcon, matchPrefix: "/dashboard" },
    { kind: "link", key: "files", label: "Files", href: "/files", icon: FolderOpen, matchPrefix: "/files" },
    { kind: "link", key: "search", label: "Search", href: "/search", icon: SearchIcon, matchPrefix: "/search" },
    {
        kind: "link",
        key: "settings",
        label: "Settings",
        href: "/settings",
        icon: SettingsIcon,
        matchPrefix: "/settings",
    },
    { kind: "more", key: "more", label: "More", icon: MoreHorizontal },
];

export function BottomTabBar() {
    const pathname = usePathname();
    const [moreOpen, setMoreOpen] = useState(false);

    const isActive = (tab: Tab) => {
        if (tab.kind !== "link" || !tab.matchPrefix) return false;
        return pathname === tab.matchPrefix || pathname.startsWith(`${tab.matchPrefix}/`);
    };

    return (
        <>
            <nav
                aria-label="Primary"
                className="md:hidden fixed inset-x-0 bottom-0 z-50 border-t border-border/50 bg-background/85 backdrop-blur-xl backdrop-saturate-150 supports-[backdrop-filter]:bg-background/75 pb-safe">
                <ul className="grid grid-cols-5 h-14">
                    {TABS.map((tab) => {
                        const Icon = tab.icon;
                        const active = tab.kind === "more" ? moreOpen : isActive(tab);
                        const labelClass = cn(
                            "text-[10px] tracking-wider uppercase font-light transition-colors",
                            active ? "text-foreground" : "text-muted-foreground"
                        );
                        const iconWrap = (
                            <span className="relative flex items-center justify-center">
                                <Icon
                                    className={cn(
                                        "size-5 transition-colors",
                                        active ? "text-primary" : "text-muted-foreground"
                                    )}
                                    strokeWidth={1.5}
                                />
                                <span
                                    aria-hidden
                                    className={cn(
                                        "absolute -top-2 left-1/2 -translate-x-1/2 h-px bg-primary transition-all duration-300",
                                        active ? "w-6 opacity-100" : "w-0 opacity-0"
                                    )}
                                />
                            </span>
                        );

                        if (tab.kind === "more") {
                            return (
                                <li key={tab.key}>
                                    <button
                                        type="button"
                                        onClick={() => setMoreOpen(true)}
                                        aria-expanded={moreOpen}
                                        aria-label="More options"
                                        className="w-full h-full flex flex-col items-center justify-center gap-1 cursor-pointer active:bg-muted/40 transition-colors">
                                        {iconWrap}
                                        <span className={labelClass}>{tab.label}</span>
                                    </button>
                                </li>
                            );
                        }

                        return (
                            <li key={tab.key}>
                                <Link
                                    href={tab.href}
                                    aria-current={active ? "page" : undefined}
                                    className="w-full h-full flex flex-col items-center justify-center gap-1 active:bg-muted/40 transition-colors">
                                    {iconWrap}
                                    <span className={labelClass}>{tab.label}</span>
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            <MoreSheet open={moreOpen} onOpenChange={setMoreOpen} />
        </>
    );
}
