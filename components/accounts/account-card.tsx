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

    // Fetch debrid user info for this account
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
                    "relative flex flex-col h-full rounded-sm border border-border/50 bg-card p-4 transition-all duration-300",
                    isCurrentAccount && "ring-2 ring-primary ring-offset-1 ring-offset-background"
                )}>
                {isCurrentAccount && (
                    <span className="absolute -top-2.5 left-4 text-xs tracking-wider uppercase px-2 py-0.5 bg-primary text-primary-foreground rounded-sm">
                        Active
                    </span>
                )}

                {/* Header */}
                <div className="flex items-start gap-3 mb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-muted/50 shrink-0">
                        <ServiceIcon type={account.type as AccountType} className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                        {userInfo ? (
                            <h3 className="font-light text-lg truncate" title={userInfo.name}>
                                {userInfo.name}
                            </h3>
                        ) : (
                            <Skeleton className="h-6 w-32" />
                        )}
                        <p className="text-xs text-muted-foreground truncate" title={formatAccountType(account.type)}>
                            {formatAccountType(account.type)}
                        </p>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1">
                    {userInfo ? (
                        <div className="space-y-2">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">Email</span>
                                <span className="truncate ml-2" title={userInfo.email}>
                                    {userInfo.email}
                                </span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">Status</span>
                                <span className={userInfo.isPremium ? "text-green-600" : "text-muted-foreground"}>
                                    {userInfo.isPremium ? "Premium" : "Free"}
                                </span>
                            </div>
                            {userInfo.premiumExpiresAt && (
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground">Expires</span>
                                    <span>{format(userInfo.premiumExpiresAt, "PP")}</span>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <Skeleton className="h-4 w-12" />
                                <Skeleton className="h-4 w-32" />
                            </div>
                            <div className="flex justify-between items-center">
                                <Skeleton className="h-4 w-12" />
                                <Skeleton className="h-4 w-16" />
                            </div>
                            <div className="flex justify-between items-center">
                                <Skeleton className="h-4 w-14" />
                                <Skeleton className="h-4 w-20" />
                            </div>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="mt-4 pt-3 border-t border-border/50">
                    <div className="flex gap-2 justify-end">
                        {!isCurrentAccount && (
                            <Button variant="outline" onClick={handleSwitch}>
                                <ArrowRightLeft className="size-4" />
                                Switch
                            </Button>
                        )}
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setRemoveDialogOpen(true)}
                            className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                            aria-label="Remove account">
                            <Trash2 className="size-4" />
                        </Button>
                    </div>
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
