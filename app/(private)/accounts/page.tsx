"use client";

import { useRouter } from "next/navigation";
import { Users, Plus, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useUserStore } from "@/lib/stores/users";
import { useShallow } from "zustand/react/shallow";
import { AccountCard } from "@/components/accounts/account-card";
import { PageHeader } from "@/components/page-header";

export default function AccountsPage() {
    const router = useRouter();

    const { users, currentUser, logout } = useUserStore(
        useShallow((state) => ({
            users: state.users,
            currentUser: state.currentUser,
            logout: state.logout,
        }))
    );

    const handleLogoutAll = () => {
        logout();
        router.push("/login");
    };

    return (
        <div className="mx-auto w-full max-w-5xl space-y-8 pb-16">
            <PageHeader
                icon={Users}
                title="Accounts"
                description="Manage your debrid service accounts"
                action={
                    <Button onClick={() => router.push("/accounts/add")} size="sm" className="sm:size-default">
                        <Plus className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">Add Account</span>
                    </Button>
                }
            />

            <div className="grid gap-6 md:grid-cols-2">
                {users.map((user) => (
                    <AccountCard key={user.id} user={user} isCurrentAccount={user.id === currentUser?.id} />
                ))}
            </div>

            <Card className="border-destructive/50 bg-destructive/5">
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-destructive/10 shrink-0">
                            <LogOut className="h-5 w-5 text-destructive" />
                        </div>
                        <div>
                            <CardTitle>Logout</CardTitle>
                            <CardDescription>Remove all accounts and logout</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="pt-0">
                    <Button variant="destructive" onClick={handleLogoutAll}>
                        Logout All Accounts
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
