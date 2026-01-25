"use client";

import { useState, useCallback } from "react";
import * as React from "react";
import { ArrowRightLeft, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
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
            <Card
                className={cn(
                    "relative transition-all flex flex-col h-full",
                    isCurrentAccount && "border-primary/50 ring-2 ring-primary/20"
                )}>
                {isCurrentAccount && (
                    <Badge className="absolute -top-2.5 left-4" variant="default">
                        Active
                    </Badge>
                )}

                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                            <ServiceIcon type={account.type as AccountType} className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <CardTitle className="truncate" title={userInfo?.username || "Loading..."}>
                                {userInfo?.username || "Loading..."}
                            </CardTitle>
                            <CardDescription className="truncate" title={formatAccountType(account.type)}>
                                {formatAccountType(account.type)}
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="flex flex-col flex-1 pt-0">
                    {userInfo ? (
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Email</span>
                                <span className="font-medium truncate" title={userInfo.email}>
                                    {userInfo.email}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Status</span>
                                <Badge variant={userInfo.isPremium ? "secondary" : "outline"}>
                                    {userInfo.isPremium ? "Premium" : "Free"}
                                </Badge>
                            </div>
                            {userInfo.premiumExpiresAt && (
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground">Expires</span>
                                    <span className="font-medium">{format(userInfo.premiumExpiresAt, "PP")}</span>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-sm text-muted-foreground">Loading account info...</div>
                    )}

                    <div className="mt-auto pt-3 space-y-3">
                        <Separator />

                        <div className="flex flex-wrap gap-2 justify-end">
                            {!isCurrentAccount && (
                                <Button variant="outline" onClick={handleSwitch}>
                                    <ArrowRightLeft className="h-4 w-4 mr-2" />
                                    Switch
                                </Button>
                            )}
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => setRemoveDialogOpen(true)}
                                className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                                aria-label="Remove account">
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

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
