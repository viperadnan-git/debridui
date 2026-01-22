"use client";

import * as React from "react";

import { NavMain } from "@/components/sidebar/nav-main";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarRail } from "@/components/ui/sidebar";
import { AccountSwitcher } from "./account-switcher";
import { FolderOpen, SearchIcon, HomeIcon, SettingsIcon, UsersIcon } from "lucide-react";
import { useSearch } from "@/components/mdb/search-provider";
import { SidebarFooterContent } from "./sidebar-footer";

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
            icon: FolderOpen,
        },
        {
            title: "Accounts",
            url: "/accounts",
            icon: UsersIcon,
        },
        {
            title: "Settings",
            url: "/settings",
            icon: SettingsIcon,
        },
    ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
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
            <SidebarFooter className="border-t border-sidebar-border/50">
                <SidebarFooterContent />
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    );
}
