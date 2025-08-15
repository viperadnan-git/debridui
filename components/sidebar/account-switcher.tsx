"use client";

import * as React from "react";
import { ChevronsUpDown, Plus, User, Check, Trash2, LogOut } from "lucide-react";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from "@/components/ui/sidebar";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { AddAccount } from "./add-account";
import { formatAccountType } from "@/lib/utils";
import { useRouter } from "next/navigation";

export function AccountSwitcher() {
    const { users, currentUser, switchAccount, removeAccount, logout } = useAuth();
    const { isMobile } = useSidebar();
    const router = useRouter();
    const [isAddAccountOpen, setIsAddAccountOpen] = React.useState(false);
    const [deleteUserId, setDeleteUserId] = React.useState<string | null>(null);

    if (!currentUser) {
        return null;
    }

    const handleRemoveAccount = (userId: string) => {
        removeAccount(userId);
        setDeleteUserId(null);
        if (users.length === 1) {
            router.push("/login");
        }
    };

    const handleLogout = () => {
        logout();
        router.push("/login");
    };

    return (
        <>
            <SidebarMenu>
                <SidebarMenuItem>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <SidebarMenuButton
                                size="lg"
                                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                            >
                                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                                    <User className="size-4" />
                                </div>
                                <div className="grid flex-1 text-left text-sm leading-tight">
                                    <span className="truncate font-medium">{currentUser.username}</span>
                                    <span className="truncate text-xs">{formatAccountType(currentUser.type)}</span>
                                </div>
                                <ChevronsUpDown className="ml-auto" />
                            </SidebarMenuButton>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                            align="start"
                            side={isMobile ? "bottom" : "right"}
                            sideOffset={4}
                        >
                            <DropdownMenuLabel className="text-muted-foreground text-xs">
                                Accounts
                            </DropdownMenuLabel>
                            {users.map((user) => (
                                <DropdownMenuItem
                                    key={user.id}
                                    onClick={() => switchAccount(user.id)}
                                    className="gap-2 p-2 flex items-center justify-between group"
                                >
                                    <div className="flex items-center gap-2">
                                        <div className="flex size-6 items-center justify-center rounded-md border">
                                            <User className="size-3.5 shrink-0" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-sm">{user.username}</span>
                                            <span className="text-xs text-muted-foreground">
                                                {formatAccountType(user.type)}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        {user.id === currentUser.id && (
                                            <Check className="size-3" />
                                        )}
                                        {users.length > 1 && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="size-5 opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setDeleteUserId(user.id);
                                                }}
                                            >
                                                <Trash2 className="size-3" />
                                            </Button>
                                        )}
                                    </div>
                                </DropdownMenuItem>
                            ))}
                            <DropdownMenuSeparator />

                            <DropdownMenuItem
                                className="gap-2 p-2"
                                onClick={() => setIsAddAccountOpen(true)}
                            >
                                <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                                    <Plus className="size-4" />
                                </div>
                                <div className="text-muted-foreground font-medium">Add account</div>
                            </DropdownMenuItem>
                            
                            <DropdownMenuItem
                                className="gap-2 p-2 text-red-600"
                                onClick={handleLogout}
                            >
                                <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                                    <LogOut className="size-4" />
                                </div>
                                <div className="font-medium">Logout</div>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </SidebarMenuItem>
            </SidebarMenu>
            
            <AddAccount isOpen={isAddAccountOpen} onOpenChange={setIsAddAccountOpen} />
            
            <AlertDialog open={!!deleteUserId} onOpenChange={() => setDeleteUserId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Remove Account</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to remove this account? You&apos;ll need to login again with your API key to access it.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => deleteUserId && handleRemoveAccount(deleteUserId)}
                        >
                            Remove
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
