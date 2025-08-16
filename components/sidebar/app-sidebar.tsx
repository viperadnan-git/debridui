"use client";

import * as React from "react";

import { NavMain } from "@/components/sidebar/nav-main";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarRail,
} from "@/components/ui/sidebar";
import { AccountSwitcher } from "./account-switcher";
import { File, Home, Settings } from "lucide-react";

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
    return (
        <Sidebar collapsible="icon" {...props}>
            <SidebarHeader>
                <AccountSwitcher />
            </SidebarHeader>
            <SidebarContent>
                <NavMain items={data.navMain} />
            </SidebarContent>
            <SidebarFooter>
                {/* <NavUser user={data.user} /> */}
                <a
                    className="flex items-center justify-center text-muted-foreground text-sm hover:underline"
                    href="https://github.com/viperadnan-git/debridui/issues"
                >
                    Report a bug
                </a>
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    );
}
