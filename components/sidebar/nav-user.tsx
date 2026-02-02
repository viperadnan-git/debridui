"use client";

import { useState } from "react";
import { ChevronsUpDown, LogOut, User as UserIcon, Settings, HelpCircle } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useAuth } from "@/components/auth/auth-provider";
import Link from "next/link";

export function NavUser() {
    const { isMobile, setOpenMobile } = useSidebar();
    const { session, logout, isLoggingOut } = useAuth();
    const [showLogoutDialog, setShowLogoutDialog] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);

    const user = {
        name: session?.user?.name || "User",
        email: session?.user?.email || "",
        avatar: session?.user?.image || "",
    };

    const userInitials =
        user.name
            ?.split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2) || "U";

    const handleNavigation = () => {
        setDropdownOpen(false);
        if (isMobile) {
            setTimeout(() => setOpenMobile(false), 150);
        }
    };

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton
                            size="lg"
                            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
                            <Avatar className="h-8 w-8 rounded-sm border border-border/50">
                                <AvatarImage src={user.avatar} alt={user.name} />
                                <AvatarFallback className="text-xs">{userInitials}</AvatarFallback>
                            </Avatar>
                            <div className="grid flex-1 text-left text-sm leading-tight">
                                <span className="truncate font-light">{user.name}</span>
                                <span className="truncate text-xs text-muted-foreground">{user.email}</span>
                            </div>
                            <ChevronsUpDown className="ml-auto size-4" />
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        className="w-(--radix-dropdown-menu-trigger-width) min-w-56"
                        side={isMobile ? "bottom" : "right"}
                        align="end"
                        sideOffset={4}>
                        <DropdownMenuLabel className="p-0 font-normal">
                            <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                                <Avatar className="h-8 w-8 rounded-sm border border-border/50">
                                    <AvatarImage src={user.avatar} alt={user.name} />
                                    <AvatarFallback className="text-xs">{userInitials}</AvatarFallback>
                                </Avatar>
                                <div className="grid flex-1 text-left text-sm leading-tight">
                                    <span className="truncate font-light">{user.name}</span>
                                    <span className="truncate text-xs text-muted-foreground">{user.email}</span>
                                </div>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuGroup>
                            <DropdownMenuItem asChild>
                                <Link href="/settings/account" onClick={handleNavigation}>
                                    <UserIcon />
                                    Account
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link href="/settings" onClick={handleNavigation}>
                                    <Settings />
                                    Settings
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link href="/help" onClick={handleNavigation}>
                                    <HelpCircle />
                                    Help
                                </Link>
                            </DropdownMenuItem>
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onClick={() => {
                                setDropdownOpen(false);
                                setShowLogoutDialog(true);
                            }}
                            disabled={isLoggingOut}
                            className="text-destructive focus:text-destructive">
                            <LogOut />
                            {isLoggingOut ? "Logging out..." : "Log out"}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>

            <ConfirmDialog
                open={showLogoutDialog}
                onOpenChange={setShowLogoutDialog}
                title="Log out"
                description="Are you sure you want to log out? You will need to sign in again to access your account."
                confirmText="Log out"
                cancelText="Cancel"
                onConfirm={() => {
                    setShowLogoutDialog(false);
                    logout();
                }}
                variant="destructive"
            />
        </SidebarMenu>
    );
}
