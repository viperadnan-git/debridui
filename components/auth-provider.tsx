"use client";

import { useAuth } from "@/hooks/use-auth";

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const { isReady } = useAuth();

    if (!isReady) {
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
