"use client";

import { useState, useCallback } from "react";
import * as React from "react";
import { ArrowRightLeft, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AccountType } from "@/lib/types";
import { formatAccountType, cn } from "@/lib/utils";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { ServiceIcon } from "./service-icon";
import { useAuth } from "@/components/auth/auth-provider";
import { useRemoveUserAccount, useDebridUserInfo } from "@/hooks/use-user-accounts";
import type { UserAccount } from "@/lib/db";

interface AccountCardProps {
    account: UserAccount;
    isCurrentAccount: boolean;
}

// `rerender-memo` - Memoize component to prevent unnecessary re-renders
export const AccountCard = React.memo(function AccountCard({ account, isCurrentAccount }: AccountCardProps) {
    const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
    const { switchAccount } = useAuth();
    const removeAccount = useRemoveUserAccount();

    const { data: userInfo } = useDebridUserInfo(account);

    // `rerender-defer-reads` - Use callbacks to avoid subscribing to switchAccount identity
    const handleSwitch = useCallback(() => {
        switchAccount(account.id);
    }, [switchAccount, account.id]);

    const handleRemove = useCallback(() => {
        removeAccount.mutate(account.id);
        setRemoveDialogOpen(false);
    }, [removeAccount, account.id]);

    return (
        <>
            <div
                className={cn(
                    "group relative rounded-sm border bg-card p-3 sm:p-5 transition-colors duration-300",
                    isCurrentAccount ? "border-primary" : "border-border/50 hover:border-border"
                )}>
                {/* Active badge on border */}
                {isCurrentAccount && (
                    <span className="absolute -top-2.5 left-3 sm:left-4 px-2 py-0.5 text-[10px] tracking-widest uppercase bg-primary text-primary-foreground rounded-sm">
                        Active
                    </span>
                )}
                {/* Header: Icon + Name + Actions */}
                <div className="flex items-center gap-2.5 sm:gap-3 mb-3 sm:mb-4">
                    <div
                        className={cn(
                            "flex size-9 sm:size-10 items-center justify-center rounded-sm shrink-0 transition-colors",
                            isCurrentAccount ? "bg-primary/10" : "bg-muted/50"
                        )}>
                        <ServiceIcon
                            type={account.type as AccountType}
                            className={cn(
                                "size-4 sm:size-5",
                                isCurrentAccount ? "text-primary" : "text-muted-foreground"
                            )}
                        />
                    </div>

                    <div className="flex-1 min-w-0">
                        {userInfo ? (
                            <>
                                <h3 className="text-sm sm:text-base font-light">{userInfo.name}</h3>
                                <div className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
                                    {formatAccountType(account.type)}
                                </div>
                            </>
                        ) : (
                            <>
                                <Skeleton className="h-5 w-32" />
                                <Skeleton className="h-3 w-20 mt-1" />
                            </>
                        )}
                    </div>

                    {/* Desktop/Tablet actions */}
                    <div className="hidden sm:flex items-center gap-1 shrink-0">
                        {!isCurrentAccount && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleSwitch}
                                className="text-muted-foreground hover:text-foreground">
                                <ArrowRightLeft className="size-4" />
                                Switch
                            </Button>
                        )}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-muted-foreground hover:text-destructive"
                            onClick={() => setRemoveDialogOpen(true)}
                            aria-label="Remove account">
                            <Trash2 className="size-4" />
                        </Button>
                    </div>
                </div>

                {/* Stats Grid - 3 blocks: Email, Plan, Expires */}
                {userInfo ? (
                    <div className="grid grid-cols-3 gap-2.5 sm:gap-4 lg:gap-6">
                        <div className="col-span-3 sm:col-span-1 pl-2.5 sm:pl-3 border-l border-border/50">
                            <div className="text-[10px] tracking-widest uppercase text-muted-foreground mb-0.5">
                                Email
                            </div>
                            <div className="text-xs sm:text-sm break-all sm:break-normal">{userInfo.email}</div>
                        </div>
                        <div className="pl-2.5 sm:pl-3 border-l border-border/50">
                            <div className="text-[10px] tracking-widest uppercase text-muted-foreground mb-0.5">
                                Plan
                            </div>
                            <div
                                className={cn(
                                    "text-xs sm:text-sm",
                                    userInfo.isPremium && "text-green-600 dark:text-green-500"
                                )}>
                                {userInfo.isPremium ? "Premium" : "Free"}
                            </div>
                        </div>
                        <div className="pl-2.5 sm:pl-3 border-l border-border/50">
                            <div className="text-[10px] tracking-widest uppercase text-muted-foreground mb-0.5">
                                Expires
                            </div>
                            <div className="text-xs sm:text-sm">
                                {userInfo.premiumExpiresAt ? format(userInfo.premiumExpiresAt, "PP") : "—"}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-3 gap-2.5 sm:gap-4 lg:gap-6">
                        <div className="col-span-3 sm:col-span-1 pl-2.5 sm:pl-3 border-l border-border/50">
                            <Skeleton className="h-2.5 w-12 mb-1.5" />
                            <Skeleton className="h-3.5 sm:h-4 w-48 sm:w-32" />
                        </div>
                        <div className="pl-2.5 sm:pl-3 border-l border-border/50">
                            <Skeleton className="h-2.5 w-12 mb-1.5" />
                            <Skeleton className="h-3.5 sm:h-4 w-16" />
                        </div>
                        <div className="pl-2.5 sm:pl-3 border-l border-border/50">
                            <Skeleton className="h-2.5 w-12 mb-1.5" />
                            <Skeleton className="h-3.5 sm:h-4 w-24" />
                        </div>
                    </div>
                )}

                {/* Mobile actions - bottom row */}
                <div className="flex sm:hidden items-center gap-2 mt-3 pt-3 border-t border-border/50">
                    {!isCurrentAccount && (
                        <Button variant="outline" size="sm" onClick={handleSwitch} className="flex-1">
                            <ArrowRightLeft className="size-4" />
                            Switch
                        </Button>
                    )}
                    <Button
                        variant="outline"
                        size="sm"
                        className={cn(
                            "text-muted-foreground hover:text-destructive hover:border-destructive",
                            isCurrentAccount && "flex-1"
                        )}
                        onClick={() => setRemoveDialogOpen(true)}>
                        <Trash2 className="size-4" />
                        Remove
                    </Button>
                </div>
            </div>

            <ConfirmDialog
                open={removeDialogOpen}
                onOpenChange={setRemoveDialogOpen}
                title="Remove Account"
                description="Are you sure you want to remove this account? You'll need to add it again to access it."
                confirmText="Remove"
                onConfirm={handleRemove}
                variant="destructive"
            />
        </>
    );
});
