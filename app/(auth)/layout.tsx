"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { AuthProvider } from "@/components/auth/auth-provider";
import { SplashScreen } from "@/components/splash-screen";

// Parent layout for all authenticated routes (onboarding + private)
// `client-swr-dedup` - Single AuthProvider for all authenticated routes
export default function AuthLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const { data: session, isPending } = authClient.useSession();

    useEffect(() => {
        if (!isPending && !session) {
            router.push("/login");
        }
    }, [session, isPending, router]);

    if (isPending) {
        return <SplashScreen />;
    }

    if (!session) {
        return <SplashScreen />;
    }

    return <AuthProvider>{children}</AuthProvider>;
}
