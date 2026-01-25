"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { Users, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AccountCard } from "@/components/accounts/account-card";
import { PageHeader } from "@/components/page-header";
import { useAuth } from "@/components/auth/auth-provider";

export default function AccountsPage() {
    const router = useRouter();
    const { userAccounts, currentAccount } = useAuth();

    // `rerender-dependencies` - Memoize currentAccountId to avoid re-renders
    const currentAccountId = currentAccount?.id;

    // `rerender-defer-reads` - Stable callback reference
    const handleAddAccount = useCallback(() => {
        router.push("/accounts/add");
    }, [router]);

    return (
        <div className="mx-auto w-full max-w-5xl space-y-8 pb-16">
            <PageHeader
                icon={Users}
                title="Accounts"
                description="Manage your debrid service accounts"
                action={
                    <Button onClick={handleAddAccount} size="sm" className="sm:size-default">
                        <Plus className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">Add Account</span>
                    </Button>
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
