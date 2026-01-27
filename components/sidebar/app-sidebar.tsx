"use client";

import * as React from "react";

import { NavMain } from "@/components/sidebar/nav-main";
import { NavUser } from "@/components/sidebar/nav-user";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarRail } from "@/components/ui/sidebar";
import { AccountSwitcher } from "./account-switcher";
import { FolderOpen, SearchIcon, HomeIcon, SettingsIcon, UsersIcon, Puzzle, Download } from "lucide-react";
import { useSearch } from "@/components/mdb/search-provider";

const data = {
    navMain: [
        {
            title: "Dashboard",
            url: "/dashboard",
            icon: HomeIcon,
        },
        {
            title: "Search",
            url: "/search",
            icon: SearchIcon,
        },
        {
            title: "Files",
            url: "/files",
            icon: FolderOpen,
        },
        {
            title: "Downloads",
            url: "/downloads",
            icon: Download,
        },
        {
            title: "Addons",
            url: "/addons",
            icon: Puzzle,
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
            <SidebarFooter className="border-t border-sidebar-border/50">
                <NavUser />
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    );
}
