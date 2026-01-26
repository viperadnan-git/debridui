"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { Users, Plus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AccountCard } from "@/components/accounts/account-card";
import { PageHeader } from "@/components/page-header";
import { useAuth } from "@/components/auth/auth-provider";

export default function AccountsPage() {
    const router = useRouter();
    const { userAccounts, currentAccount, refetchAccounts } = useAuth();
    const [isRefreshing, setIsRefreshing] = useState(false);

    // `rerender-dependencies` - Memoize currentAccountId to avoid re-renders
    const currentAccountId = currentAccount?.id;

    // `rerender-defer-reads` - Stable callback reference
    const handleAddAccount = useCallback(() => {
        router.push("/accounts/add");
    }, [router]);

    const handleRefresh = useCallback(async () => {
        setIsRefreshing(true);
        await refetchAccounts();
        setIsRefreshing(false);
    }, [refetchAccounts]);

    return (
        <div className="mx-auto w-full max-w-5xl space-y-8 pb-16">
            <PageHeader
                icon={Users}
                title="Accounts"
                description="Manage your debrid service accounts"
                action={
                    <div className="flex gap-2 w-full sm:w-auto">
                        <Button
                            onClick={handleRefresh}
                            disabled={isRefreshing}
                            variant="outline"
                            size="sm"
                            className="flex-1 sm:flex-none">
                            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
                            Refresh
                        </Button>
                        <Button onClick={handleAddAccount} size="sm" className="flex-1 sm:flex-none">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Account
                        </Button>
                    </div>
                }
            />

            <div className="grid gap-6 md:grid-cols-2">
                {userAccounts.map((account) => (
                    <AccountCard
                        key={account.id}
                        account={account}
                        isCurrentAccount={account.id === currentAccountId}
                    />
                ))}
            </div>
        </div>
    );
}
