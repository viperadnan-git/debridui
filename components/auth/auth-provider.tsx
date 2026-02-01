"use client";

import { createContext, useContext, useEffect, useState, useMemo, useCallback, startTransition } from "react";
import { authClient } from "@/lib/auth-client";
import { useUserAccounts, useDebridUserInfo, useRemoveUserAccount } from "@/hooks/use-user-accounts";
import type { UserAccount } from "@/lib/db";
import type { User } from "@/lib/types";
import { getClientInstance } from "@/lib/clients";
import type { DebridClient } from "@/lib/clients";
import { SplashScreen } from "@/components/splash-screen";
import { SplashErrorScreen } from "@/components/splash-error-screen";
import { useRouter, usePathname } from "next/navigation";
import { clearAppCache } from "@/lib/utils";
import { toast } from "sonner";

interface AuthContextType {
    session: ReturnType<typeof authClient.useSession>["data"];
    userAccounts: UserAccount[];
    currentAccount: UserAccount | null;
    currentUser: User | null; // Debrid user info
    client: DebridClient | null;
    isLoading: boolean;
    isLoggingOut: boolean;
    switchAccount: (accountId: string) => void;
    refetchAccounts: () => void;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within AuthProvider");
    }
    return context;
}

// Helper hook for components inside private routes
// Private layout guarantees non-null currentAccount, currentUser and client
export function useAuthGuaranteed() {
    const { currentAccount, currentUser, client, ...rest } = useAuth();

    if (!currentAccount || !currentUser || !client) {
        throw new Error("useAuthGuaranteed can only be used in private routes");
    }

    return { currentAccount, currentUser, client, ...rest };
}

interface AuthProviderProps {
    children: React.ReactNode;
}

// `client-swr-dedup` - Single AuthProvider for all authenticated routes
export function AuthProvider({ children }: AuthProviderProps) {
    const router = useRouter();
    const pathname = usePathname();
    const { data: session, isPending: isSessionPending, error: sessionError } = authClient.useSession();
    // Only fetch accounts when session exists
    const { data: userAccounts = [], isLoading: isAccountsLoading, refetch } = useUserAccounts(!!session);

    const accountsLength = userAccounts.length;

    // State for account switching (forces re-render when changed)
    const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    // `rerender-memo` - Memoize account ID selection (involves array operations)
    const currentAccountId = useMemo(() => {
        if (accountsLength === 0) return null;

        // Priority: manually selected > localStorage > first account
        if (selectedAccountId && userAccounts.some((acc) => acc.id === selectedAccountId)) {
            return selectedAccountId;
        }

        const savedId = typeof window !== "undefined" ? localStorage.getItem("selected-account-id") : null;
        if (savedId && userAccounts.some((acc) => acc.id === savedId)) {
            return savedId;
        }

        return userAccounts[0].id;
    }, [accountsLength, selectedAccountId, userAccounts]);

    // Memoize current account lookup
    const currentAccount = useMemo(
        () => userAccounts.find((acc) => acc.id === currentAccountId) || null,
        [userAccounts, currentAccountId]
    );

    // Use React Query to fetch and cache debrid user info
    const {
        data: currentUser = null,
        isLoading: isLoadingUser,
        isError: isUserError,
        error: userError,
        refetch: refetchUser,
    } = useDebridUserInfo(currentAccount);

    // Mutation for removing accounts (used in error recovery)
    const { mutate: removeAccount } = useRemoveUserAccount();

    // Centralized redirect logic - single source of truth for all auth redirects
    useEffect(() => {
        if (isSessionPending || isAccountsLoading) return;

        // No session → login
        if (!session) {
            router.push("/login");
            return;
        }

        const hasAccounts = userAccounts.length > 0;
        const isOnboarding = pathname === "/onboarding";

        // Has accounts + on onboarding → dashboard
        if (hasAccounts && isOnboarding) {
            router.push("/dashboard");
            return;
        }

        // No accounts + not on onboarding → onboarding
        if (!hasAccounts && !isOnboarding) {
            router.push("/onboarding");
        }
    }, [session, isSessionPending, isAccountsLoading, userAccounts.length, pathname, router]);

    // Sync currentAccountId to localStorage when it changes
    useEffect(() => {
        if (currentAccountId) {
            localStorage.setItem("selected-account-id", currentAccountId);
        }
    }, [currentAccountId]);

    // Memoize client instance
    const client = useMemo(() => {
        if (!currentUser) return null;
        return getClientInstance(currentUser);
    }, [currentUser]);

    // `rerender-defer-reads` - Stable callback for switching accounts
    const switchAccount = useCallback((accountId: string) => {
        localStorage.setItem("selected-account-id", accountId);
        startTransition(() => {
            setSelectedAccountId(accountId);
        });
    }, []);

    // Logout function
    const logout = useCallback(async () => {
        setIsLoggingOut(true);
        const toastId = toast.loading("Logging out...");
        try {
            await clearAppCache();
            await authClient.signOut();

            toast.success("Logged out successfully", { id: toastId });
            router.push("/login");
        } catch (error) {
            toast.error("Failed to logout", { id: toastId });
            console.error("Error logging out:", error);
        } finally {
            setIsLoggingOut(false);
        }
    }, [router]);

    // `rerender-memo` - Memoize context value to prevent unnecessary rerenders
    const contextValue = useMemo<AuthContextType>(
        () => ({
            session,
            userAccounts,
            currentAccount,
            currentUser,
            client,
            isLoading: isSessionPending || isAccountsLoading || isLoadingUser,
            isLoggingOut,
            switchAccount,
            refetchAccounts: refetch,
            logout,
        }),
        [
            session,
            userAccounts,
            currentAccount,
            currentUser,
            client,
            isSessionPending,
            isAccountsLoading,
            isLoadingUser,
            isLoggingOut,
            switchAccount,
            refetch,
            logout,
        ]
    );

    // Show error screen when session check fails
    if (sessionError) {
        return (
            <SplashErrorScreen
                title="Session Error"
                error={sessionError instanceof Error ? sessionError : new Error("Failed to verify session")}
                onRetry={() => window.location.reload()}
            />
        );
    }

    // Show splash during: session check, no session (redirect), accounts loading, user info loading
    if (isSessionPending || !session || isAccountsLoading || (accountsLength > 0 && isLoadingUser)) {
        return <SplashScreen />;
    }

    // Show error screen when account fetch fails
    if (isUserError && currentAccount) {
        return (
            <SplashErrorScreen
                title="Debrid Account Error"
                error={userError}
                onRetry={refetchUser}
                onDelete={() => removeAccount(currentAccount.id)}
                onLogout={logout}
            />
        );
    }

    return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}
