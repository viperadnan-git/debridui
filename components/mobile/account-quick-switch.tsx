"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Plus, ChevronRight } from "lucide-react";

import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ServiceIcon } from "@/components/accounts/service-icon";
import { useAuth } from "@/components/auth/auth-provider";
import { formatAccountType } from "@/lib/utils";
import { AccountType } from "@/lib/types";
import { cn } from "@/lib/utils";

export function AccountQuickSwitch() {
    const { session, userAccounts, currentAccount, switchAccount } = useAuth();
    const [open, setOpen] = useState(false);

    if (!currentAccount) return null;

    const userName = session?.user?.name || "User";
    const userImage = session?.user?.image || "";
    const initials =
        userName
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2) || "U";

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                aria-label={`Account: ${currentAccount.name}. Tap to switch.`}
                className="relative size-9 rounded-sm hover:bg-muted/40 active:bg-muted/50 transition-colors flex items-center justify-center">
                <Avatar className="size-8 rounded-sm border border-border/50">
                    <AvatarImage src={userImage} alt={userName} />
                    <AvatarFallback className="text-[10px] font-light tracking-wider uppercase">
                        {initials}
                    </AvatarFallback>
                </Avatar>
                <span
                    aria-hidden
                    className="absolute -bottom-0.5 -right-0.5 flex size-4 items-center justify-center rounded-sm bg-background ring-2 ring-background">
                    <span className="flex size-full items-center justify-center bg-muted rounded-[2px]">
                        <ServiceIcon type={currentAccount.type as AccountType} className="size-2.5" />
                    </span>
                </span>
            </button>

            <Drawer open={open} onOpenChange={setOpen}>
                <DrawerContent className="rounded-t-sm border-border/60 max-h-[85vh] data-[vaul-drawer-direction=bottom]:rounded-t-sm">
                    <DrawerHeader className="px-5 pt-2 pb-3 text-left! md:text-left">
                        <DrawerTitle className="text-xs tracking-widest uppercase text-muted-foreground font-light text-left">
                            Account
                        </DrawerTitle>
                        <DrawerDescription className="sr-only">Switch debrid account</DrawerDescription>
                    </DrawerHeader>

                    {/* Signed-in user header — opens account settings */}
                    <Link
                        href="/settings/account"
                        onClick={() => setOpen(false)}
                        aria-label="Open account settings"
                        className="mx-2 mb-3 px-3 py-2 flex items-center gap-3 rounded-sm hover:bg-muted/40 active:bg-muted/50 transition-colors">
                        <Avatar className="size-10 rounded-sm border border-border/50">
                            <AvatarImage src={userImage} alt={userName} />
                            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                            <div className="text-sm font-light truncate">{userName}</div>
                            <div className="text-xs text-muted-foreground truncate">
                                {session?.user?.email || "Signed in"}
                            </div>
                        </div>
                        <ChevronRight className="size-4 text-muted-foreground shrink-0" />
                    </Link>

                    <div className="mx-5 h-px bg-border/50" />

                    <div className="px-5 pt-3 pb-1">
                        <span className="text-xs tracking-widest uppercase text-muted-foreground font-light">
                            Switch debrid
                        </span>
                    </div>

                    <div className="overflow-y-auto px-2 pb-[max(env(safe-area-inset-bottom),1rem)]">
                        <ul>
                            {userAccounts.map((account) => {
                                const isCurrent = account.id === currentAccount.id;
                                return (
                                    <li key={account.id}>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                switchAccount(account.id);
                                                setOpen(false);
                                            }}
                                            className={cn(
                                                "w-full flex items-center gap-3 px-3 py-3 rounded-sm transition-colors",
                                                "hover:bg-muted/40 active:bg-muted/50",
                                                isCurrent && "bg-muted/30"
                                            )}>
                                            <span className="flex size-9 items-center justify-center bg-muted/40 rounded-sm shrink-0">
                                                <ServiceIcon type={account.type as AccountType} className="size-4" />
                                            </span>
                                            <span className="flex-1 min-w-0 text-left">
                                                <span className="block text-sm font-light truncate">
                                                    {account.name}
                                                </span>
                                                <span className="block text-xs text-muted-foreground truncate">
                                                    {formatAccountType(account.type)}
                                                </span>
                                            </span>
                                            {isCurrent && (
                                                <Check className="size-4 text-primary shrink-0" strokeWidth={1.5} />
                                            )}
                                        </button>
                                    </li>
                                );
                            })}

                            <li>
                                <Link
                                    href="/accounts/add"
                                    onClick={() => setOpen(false)}
                                    className="flex items-center gap-3 px-3 py-3 rounded-sm hover:bg-muted/40 active:bg-muted/50 transition-colors">
                                    <span className="flex size-9 items-center justify-center rounded-sm border border-dashed border-border/60 shrink-0">
                                        <Plus className="size-4" strokeWidth={1.5} />
                                    </span>
                                    <span className="text-sm font-light">Add account</span>
                                </Link>
                            </li>
                        </ul>
                    </div>
                </DrawerContent>
            </Drawer>
        </>
    );
}
