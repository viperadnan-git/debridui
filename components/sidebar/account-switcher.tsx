"use client";

import * as React from "react";
import { ChevronsUpDown, Plus, Check } from "lucide-react";
import Link from "next/link";

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
import { ServiceIcon } from "@/components/accounts/service-icon";
import { AccountType } from "@/lib/types";
import { useAuth } from "@/components/auth/auth-provider";

export const AccountSwitcher = React.memo(function AccountSwitcher() {
    const { userAccounts, currentAccount, switchAccount } = useAuth();
    const { isMobile, setOpenMobile } = useSidebar();
    const [dropdownOpen, setDropdownOpen] = React.useState(false);

    if (!currentAccount) {
        return null;
    }

    const handleNavigation = () => {
        setDropdownOpen(false);
        if (isMobile) {
            setTimeout(() => setOpenMobile(false), 150);
        }
    };

    return (
        <>
            <SidebarMenu>
                <SidebarMenuItem>
                    <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
                        <DropdownMenuTrigger asChild>
                            <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent">
                                <div className="flex size-9 items-center justify-center rounded-sm bg-muted/50 shrink-0">
                                    <ServiceIcon type={currentAccount.type as AccountType} className="size-5" />
                                </div>
                                <div className="grid flex-1 text-left text-sm leading-tight min-w-0">
                                    <span className="truncate font-light" title={currentAccount.name}>
                                        {currentAccount.name}
                                    </span>
                                    <span className="truncate text-xs text-muted-foreground">
                                        {formatAccountType(currentAccount.type)}
                                    </span>
                                </div>
                                <ChevronsUpDown className="ml-auto size-4 text-muted-foreground shrink-0" />
                            </SidebarMenuButton>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            className="w-(--radix-dropdown-menu-trigger-width) min-w-64 p-2"
                            align="start"
                            side={isMobile ? "bottom" : "right"}
                            sideOffset={8}>
                            <DropdownMenuLabel className="text-xs tracking-widest uppercase text-muted-foreground px-2 py-1.5">
                                Accounts
                            </DropdownMenuLabel>
                            {userAccounts.map((account) => (
                                <DropdownMenuItem
                                    key={account.id}
                                    onClick={() => {
                                        handleNavigation();
                                        switchAccount(account.id);
                                    }}
                                    className="gap-3 p-2.5 flex items-center justify-between cursor-pointer">
                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                        <div className="flex size-8 items-center justify-center rounded-sm bg-muted/50 shrink-0">
                                            <ServiceIcon type={account.type as AccountType} className="size-4" />
                                        </div>
                                        <div className="flex flex-col min-w-0 flex-1">
                                            <span className="text-sm font-light truncate">{account.name}</span>
                                            <span className="text-xs text-muted-foreground truncate">
                                                {formatAccountType(account.type)}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                        {account.id === currentAccount.id && <Check className="size-4 text-primary" />}
                                    </div>
                                </DropdownMenuItem>
                            ))}
                            <DropdownMenuSeparator className="my-2" />

                            <DropdownMenuItem className="gap-3 p-2.5 cursor-pointer" asChild>
                                <Link href="/accounts/add" onClick={handleNavigation}>
                                    <div className="flex size-8 items-center justify-center rounded-sm border border-dashed border-border/50">
                                        <Plus className="size-4" />
                                    </div>
                                    <div className="font-light">Add account</div>
                                </Link>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </SidebarMenuItem>
            </SidebarMenu>
        </>
    );
});
