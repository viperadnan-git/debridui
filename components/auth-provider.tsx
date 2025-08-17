"use client";

import { useUserStore } from "@/lib/stores/users";

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const { isHydrated } = useUserStore();

    if (!isHydrated) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="animate-pulse text-muted-foreground">
                    Loading...
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
