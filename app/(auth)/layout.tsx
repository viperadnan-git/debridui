"use client";

import { AuthProvider } from "@/components/auth/auth-provider";

// Parent layout for all authenticated routes (onboarding + private)
// `client-swr-dedup` - Single AuthProvider for all authenticated routes
// All splash/redirect logic consolidated in AuthProvider to prevent flicker
export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return <AuthProvider>{children}</AuthProvider>;
}
