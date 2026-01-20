"use client";

import { useState } from "react";
import { ArrowRightLeft, RefreshCw, Share2, Trash2 } from "lucide-react";
import { format } from "date-fns";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { AccountType, User as UserType } from "@/lib/types";
import { formatAccountType, cn } from "@/lib/utils";
import { useUserStore } from "@/lib/stores/users";
import { ShareAccountDialog } from "./share-account-dialog";
import { ServiceIcon } from "./service-icon";

interface AccountCardProps {
    user: UserType;
    isCurrentAccount: boolean;
}

export function AccountCard({ user, isCurrentAccount }: AccountCardProps) {
    const [shareDialogOpen, setShareDialogOpen] = useState(false);
    const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const switchAccount = useUserStore((state) => state.switchUser);
    const removeAccount = useUserStore((state) => state.removeUser);
    const refreshUser = useUserStore((state) => state.refreshUser);

    const handleSwitch = () => {
        switchAccount(user.id);
    };

    const handleRemove = () => {
        removeAccount(user.id);
        setRemoveDialogOpen(false);
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            await refreshUser(user.id);
        } finally {
            setIsRefreshing(false);
        }
    };

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
                            <ServiceIcon type={user.type as AccountType} className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <CardTitle className="truncate" title={user.username}>
                                {user.username}
                            </CardTitle>
                            <CardDescription className="truncate" title={formatAccountType(user.type)}>
                                {formatAccountType(user.type)}
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="flex flex-col flex-1 pt-0">
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Email</span>
                            <span className="font-medium truncate" title={user.email}>
                                {user.email}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Status</span>
                            <Badge variant={user.isPremium ? "default" : "secondary"}>
                                {user.isPremium ? "Premium" : "Free"}
                            </Badge>
                        </div>
                        {user.isPremium && (
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Expires</span>
                                <span>{format(user.premiumExpiresAt, "PP")}</span>
                            </div>
                        )}
                    </div>

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
                                onClick={handleRefresh}
                                disabled={isRefreshing}
                                aria-label="Refresh account data">
                                <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
                            </Button>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => setShareDialogOpen(true)}
                                aria-label="Share account URL">
                                <Share2 className="h-4 w-4" />
                            </Button>
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

            <ShareAccountDialog user={user} open={shareDialogOpen} onOpenChange={setShareDialogOpen} />

            <AlertDialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Remove Account</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to remove this account? You&apos;ll need to login again with your API
                            key to access it.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleRemove}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Remove
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
