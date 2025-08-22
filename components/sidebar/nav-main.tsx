"use client";

import { type LucideIcon } from "lucide-react";

import { SidebarGroup, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import Link from "next/link";
import { useSidebar } from "../ui/sidebar";

export function NavMain({
    items,
    onAction,
}: {
    items: {
        title: string;
        url: string;
        icon?: LucideIcon;
        isActive?: boolean;
        action?: string;
        items?: {
            title: string;
            url: string;
        }[];
    }[];
    onAction?: (action: string) => void;
}) {
    const { setOpenMobile } = useSidebar();
    return (
        <SidebarGroup>
            <SidebarMenu>
                {items.map((item) => (
                    <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                            tooltip={item.title}
                            asChild={!item.action}
                            onClick={
                                item.action
                                    ? () => {
                                          onAction?.(item.action!);
                                          setOpenMobile(false);
                                      }
                                    : undefined
                            }>
                            {item.action ? (
                                <>
                                    {item.icon && <item.icon />}
                                    <span>{item.title}</span>
                                </>
                            ) : (
                                <Link href={item.url} onClick={() => setOpenMobile(false)}>
                                    {item.icon && <item.icon />}
                                    <span>{item.title}</span>
                                </Link>
                            )}
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                ))}
            </SidebarMenu>
        </SidebarGroup>
    );
}
