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
import { File, Home, Settings, Search } from "lucide-react";
import { useSearch } from "@/components/search-provider";
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
            icon: Home,
        },
        {
            title: "Search",
            url: "#",
            icon: Search,
            action: "search",
        },
        {
            title: "Files",
            url: "/files",
            icon: File,
        },
        {
            title: "Settings",
            url: "/settings",
            icon: Settings,
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
            <SidebarHeader>
                <AccountSwitcher />
            </SidebarHeader>
            <SidebarContent>
                <NavMain items={data.navMain} onAction={handleNavAction} />
            </SidebarContent>
            {/* <NavUser user={data.user} /> */}
            {(open || isMobile) && (
                <SidebarFooter className="flex flex-col items-center gap-2 py-6">
                    <Image
                        className="dark:invert w-1/2"
                        src="/logo.svg"
                        alt="DebridUI logo"
                        width={160}
                        height={38}
                        priority
                    />
                    <a
                        className="flex items-center justify-center text-muted-foreground text-xs uppercase hover:underline"
                        href="https://github.com/viperadnan-git/debridui/issues"
                    >
                        Report a bug
                    </a>
                </SidebarFooter>
            )}
            <SidebarRail />
        </Sidebar>
    );
}
