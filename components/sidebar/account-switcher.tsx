"use client";

import * as React from "react";
import { ChevronsUpDown, Plus, Check } from "lucide-react";

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
import { ServiceIcon } from "@/components/accounts/service-icon";
import { AccountType } from "@/lib/types";
import { useAuth } from "@/components/auth/auth-provider";

export const AccountSwitcher = React.memo(function AccountSwitcher() {
    const { userAccounts, currentUser, currentAccount, switchAccount } = useAuth();
    const { isMobile } = useSidebar();
    const router = useRouter();

    if (!currentUser || !currentAccount) {
        return null;
    }

    return (
        <>
            <SidebarMenu>
                <SidebarMenuItem>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent">
                                <div className="flex size-9 items-center justify-center rounded-lg bg-sidebar-accent/50 ring-1 ring-sidebar-border/50 shrink-0">
                                    <ServiceIcon type={currentUser.type as AccountType} className="size-5" />
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
                            {userAccounts.map((account) => (
                                <DropdownMenuItem
                                    key={account.id}
                                    onClick={() => switchAccount(account.id)}
                                    className="gap-3 p-2.5 rounded-lg flex items-center justify-between cursor-pointer">
                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                        <div className="flex size-8 items-center justify-center rounded-lg border bg-sidebar-accent/30 shrink-0">
                                            <ServiceIcon type={account.type as AccountType} className="size-4" />
                                        </div>
                                        <div className="flex flex-col min-w-0 flex-1">
                                            <span className="text-sm font-semibold truncate">
                                                {formatAccountType(account.type)}
                                            </span>
                                            <span className="text-xs text-muted-foreground truncate">
                                                {account.type}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                        {account.id === currentAccount.id && <Check className="size-4 text-primary" />}
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
                        </DropdownMenuContent>
                    </DropdownMenu>
                </SidebarMenuItem>
            </SidebarMenu>
        </>
    );
});
