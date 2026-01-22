"use client";

import { Bug } from "lucide-react";
import Image from "next/image";
import { useSidebar, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { DISCORD_URL } from "@/lib/constants";

export function SidebarFooterContent() {
    const { state, isMobile } = useSidebar();
    const isCollapsed = state === "collapsed" && !isMobile;

    return (
        <>
            {/* Logo Section */}
            <div className="flex items-center justify-center">
                <Image
                    className={`opacity-80 transition-opacity hover:opacity-100 ${isCollapsed ? "invert dark:invert-0" : "dark:invert"}`}
                    src={isCollapsed ? "/icon.svg" : "/logo.svg"}
                    alt="DebridUI logo"
                    width={isCollapsed ? 32 : 160}
                    height={isCollapsed ? 32 : 38}
                    priority
                />
            </div>

            <SidebarMenu>
                {/* Discord Button */}
                {DISCORD_URL && (
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            tooltip="Join Discord"
                            className="border transition-all"
                            style={{
                                backgroundColor: "#5865F21A",
                                color: "#5865F2",
                                borderColor: "#5865F233",
                            }}
                            asChild>
                            <a href={DISCORD_URL} target="_blank" rel="noopener noreferrer">
                                <img
                                    src="https://cdn.simpleicons.org/discord/5865F2"
                                    alt="Discord"
                                    className="size-5 shrink-0"
                                />
                                <span>Join Discord</span>
                            </a>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                )}

                {/* Report Bug Button */}
                <SidebarMenuItem>
                    <SidebarMenuButton
                        tooltip="Report a Bug"
                        className="bg-sidebar-accent/50 hover:bg-sidebar-accent border-sidebar-border/50 hover:border-sidebar-border transition-all border"
                        asChild>
                        <a
                            href="https://github.com/viperadnan-git/debridui/issues"
                            target="_blank"
                            rel="noopener noreferrer">
                            <Bug className="size-5 shrink-0" />
                            <span>Report a Bug</span>
                        </a>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>
        </>
    );
}
