"use client";

import * as React from "react";

import { NavMain } from "@/components/sidebar/nav-main";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarRail,
    useSidebar,
} from "@/components/ui/sidebar";
import { AccountSwitcher } from "./account-switcher";
import { ServerIcon, SearchIcon, HomeIcon, SettingsIcon } from "lucide-react";
import { useSearch } from "@/components/mdb/search-provider";
import Image from "next/image";

// This is sample data.
const data = {
    user: {
        name: "shadcn",
        email: "m@example.com",
        avatar: "/avatars/shadcn.jpg",
    },
    navMain: [
        {
            title: "Dashboard",
            url: "/dashboard",
            icon: HomeIcon,
        },
        {
            title: "Search",
            url: "#",
            icon: SearchIcon,
            action: "search",
        },
        {
            title: "Files",
            url: "/files",
            icon: ServerIcon,
        },
        {
            title: "Settings",
            url: "/settings",
            icon: SettingsIcon,
        },
    ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const { open, isMobile } = useSidebar();
    const { toggle: toggleSearch } = useSearch();

    const handleNavAction = (action?: string) => {
        if (action === "search") {
            toggleSearch();
        }
    };

    return (
        <Sidebar collapsible={"icon"} {...props}>
            <SidebarHeader className="border-b border-sidebar-border/50">
                <AccountSwitcher />
            </SidebarHeader>
            <SidebarContent>
                <NavMain items={data.navMain} onAction={handleNavAction} />
            </SidebarContent>
            {/* <NavUser user={data.user} /> */}
            {(open || isMobile) && (
                <SidebarFooter className="flex flex-col items-center gap-3">
                    <Image
                        className="dark:invert w-2/3 opacity-80 transition-opacity hover:opacity-100"
                        src="/logo.svg"
                        alt="DebridUI logo"
                        width={160}
                        height={38}
                        priority
                    />
                    <a
                        className="flex items-center justify-center text-muted-foreground text-xs font-medium tracking-wide uppercase hover:text-foreground transition-colors"
                        href="https://github.com/viperadnan-git/debridui/issues">
                        Report a bug
                    </a>
                </SidebarFooter>
            )}
            <SidebarRail />
        </Sidebar>
    );
}
