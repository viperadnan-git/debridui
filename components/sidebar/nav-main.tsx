"use client";

import { type LucideIcon } from "lucide-react";

import { SidebarGroup, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import Link from "next/link";
import { useSidebar } from "../ui/sidebar";
import { usePathname } from "next/navigation";

export function NavMain({
    items,
    onAction,
    className,
    variant = "default",
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
    className?: string;
    variant?: "default" | "subtle";
}) {
    const { setOpenMobile } = useSidebar();
    const pathname = usePathname();

    return (
        <SidebarGroup className={className}>
            <SidebarMenu>
                {items.map((item) => {
                    const isActive = item.url !== "#" && pathname === item.url;

                    return (
                        <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton
                                tooltip={item.title}
                                asChild={!item.action}
                                isActive={isActive}
                                className={variant === "subtle" ? "text-muted-foreground" : undefined}
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
                    );
                })}
            </SidebarMenu>
        </SidebarGroup>
    );
}
