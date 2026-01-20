"use client";

import * as React from "react";
import { ChevronsUpDown, Plus, User, Check, LogOut } from "lucide-react";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar";
import { formatAccountType } from "@/lib/utils";
import { useRouter } from "@bprogress/next/app";
import Image from "next/image";
import { useUserStore } from "@/lib/stores/users";
import { useShallow } from "zustand/react/shallow";

export function AccountSwitcher() {
    // Split selectors: primitive values with useShallow, stable functions separately
    const { users, currentUser } = useUserStore(
        useShallow((state) => ({
            users: state.users,
            currentUser: state.currentUser,
        }))
    );
    const switchAccount = useUserStore((state) => state.switchUser);
    const removeUser = useUserStore((state) => state.removeUser);

    const { isMobile } = useSidebar();
    const router = useRouter();

    if (!currentUser) {
        return null;
    }

    const handleLogout = () => {
        removeUser(currentUser.id);
        // If no users left after removal, redirect to login
        if (users.length === 1) {
            router.push("/login");
        }
    };

    return (
        <>
            <SidebarMenu>
                <SidebarMenuItem>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent">
                                <div className="flex size-9 items-center justify-center rounded-lg bg-sidebar-accent/50 ring-1 ring-sidebar-border/50 shrink-0">
                                    <Image
                                        src="/icon.svg"
                                        alt="DebridUI logo"
                                        width={20}
                                        height={20}
                                        className="size-5"
                                        priority
                                    />
                                </div>
                                <div className="grid flex-1 text-left text-sm leading-tight min-w-0">
                                    <span className="truncate font-semibold" title={currentUser.username}>
                                        {currentUser.username}
                                    </span>
                                    <span className="truncate text-xs text-muted-foreground">
                                        {formatAccountType(currentUser.type)}
                                    </span>
                                </div>
                                <ChevronsUpDown className="ml-auto size-4 text-muted-foreground shrink-0" />
                            </SidebarMenuButton>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            className="w-(--radix-dropdown-menu-trigger-width) min-w-64 rounded-xl p-2"
                            align="start"
                            side={isMobile ? "bottom" : "right"}
                            sideOffset={8}>
                            <DropdownMenuLabel className="text-muted-foreground text-xs font-semibold tracking-wider uppercase px-2 py-1.5">
                                Accounts
                            </DropdownMenuLabel>
                            {users.map((user) => (
                                <DropdownMenuItem
                                    key={user.id}
                                    onClick={() => switchAccount(user.id)}
                                    className="gap-3 p-2.5 rounded-lg flex items-center justify-between cursor-pointer">
                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                        <div className="flex size-8 items-center justify-center rounded-lg border bg-sidebar-accent/30 shrink-0">
                                            <User className="size-4 shrink-0" />
                                        </div>
                                        <div className="flex flex-col min-w-0 flex-1">
                                            <span className="text-sm font-semibold truncate" title={user.username}>
                                                {user.username}
                                            </span>
                                            <span className="text-xs text-muted-foreground truncate">
                                                {formatAccountType(user.type)}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                        {user.id === currentUser.id && <Check className="size-4 text-primary" />}
                                    </div>
                                </DropdownMenuItem>
                            ))}
                            <DropdownMenuSeparator className="my-2" />

                            <DropdownMenuItem
                                className="gap-3 p-2.5 rounded-lg cursor-pointer"
                                onClick={() => router.push("/accounts/add")}>
                                <div className="flex size-8 items-center justify-center rounded-lg border bg-sidebar-accent/30">
                                    <Plus className="size-4" />
                                </div>
                                <div className="font-semibold">Add account</div>
                            </DropdownMenuItem>

                            <DropdownMenuItem
                                className="gap-3 p-2.5 rounded-lg text-destructive hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                                onClick={handleLogout}>
                                <div className="flex size-8 items-center justify-center rounded-lg border border-destructive/20 bg-destructive/10">
                                    <LogOut className="size-4" />
                                </div>
                                <div className="font-semibold">Remove account</div>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </SidebarMenuItem>
            </SidebarMenu>
        </>
    );
}
