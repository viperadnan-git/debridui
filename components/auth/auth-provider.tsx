"use client";

import { usePathname, useRouter } from "next/navigation";
import { createContext, startTransition, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { SplashErrorScreen } from "@/components/splash-error-screen";
import { SplashScreen } from "@/components/splash-screen";
import { useDebridUserInfo, useRemoveUserAccount, useUserAccounts } from "@/hooks/use-user-accounts";
import { hydrateSettingsFromServer, useUserSettings } from "@/hooks/use-user-settings";
import { authClient } from "@/lib/auth-client";
import type { DebridClient } from "@/lib/clients";
import { getClientInstance } from "@/lib/clients";
import type { UserAccount } from "@/lib/db";
import type { AccountType } from "@/lib/types";
import { clearAppCache } from "@/lib/utils";

interface AuthContextType {
    session: ReturnType<typeof authClient.useSession>["data"];
    userAccounts: UserAccount[];
    currentAccount: UserAccount | null;
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
// Private layout guarantees non-null currentAccount and client
export function useAuthGuaranteed() {
    const { currentAccount, client, ...rest } = useAuth();

    if (!currentAccount || !client) {
        throw new Error("useAuthGuaranteed can only be used in private routes");
    }

    return { currentAccount, client, ...rest };
}

interface AuthProviderProps {
    children: React.ReactNode;
}

// `client-swr-dedup` - Single AuthProvider for all authenticated routes
export function AuthProvider({ children }: AuthProviderProps) {
    const router = useRouter();
    const pathname = usePathname();
    const { data: session, isPending: isSessionPending, error: sessionError } = authClient.useSession();
    const { data: userAccounts = [], isLoading: isAccountsLoading, refetch } = useUserAccounts();
    const { data: serverSettings } = useUserSettings();

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

    // Fetch debrid user info for API key validation only (not exposed in context)
    // Shows error screen if API key is invalid, allowing user to delete/retry
    const { isError: isUserError, error: userError, refetch: refetchUser } = useDebridUserInfo(currentAccount);

    // Mutation for removing accounts (used in error recovery)
    const { mutate: removeAccount } = useRemoveUserAccount();

    // Server layout enforces a valid session before this provider mounts.
    // If the session is invalidated mid-app (revoked/expired), bounce to /login.
    useEffect(() => {
        if (!isSessionPending && !session) router.push("/login");
    }, [isSessionPending, session, router]);

    // Route between onboarding and the app based on whether the user has accounts.
    useEffect(() => {
        if (!session || isAccountsLoading) return;
        const hasAccounts = userAccounts.length > 0;
        const isOnboarding = pathname === "/onboarding";
        if (hasAccounts === !isOnboarding) return;
        router.push(hasAccounts ? "/dashboard" : "/onboarding");
    }, [session, isAccountsLoading, userAccounts.length, pathname, router]);

    // Hydrate settings from server (once on load, non-blocking)
    const hasHydrated = useRef(false);
    useEffect(() => {
        if (serverSettings && !hasHydrated.current) {
            hasHydrated.current = true;
            hydrateSettingsFromServer(serverSettings);
        }
    }, [serverSettings]);

    // Sync currentAccountId to localStorage when it changes
    useEffect(() => {
        if (currentAccountId) {
            localStorage.setItem("selected-account-id", currentAccountId);
        }
    }, [currentAccountId]);

    // Memoize client instance - only needs account (apiKey + type)
    const client = useMemo(() => {
        if (!currentAccount) return null;
        return getClientInstance({ type: currentAccount.type as AccountType, apiKey: currentAccount.apiKey });
    }, [currentAccount]);

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
            client,
            isLoading: isSessionPending || isAccountsLoading,
            isLoggingOut,
            switchAccount,
            refetchAccounts: refetch,
            logout,
        }),
        [
            session,
            userAccounts,
            currentAccount,
            client,
            isSessionPending,
            isAccountsLoading,
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

    // Server layout has already validated the session; only block on missing accounts data.
    if (isAccountsLoading) {
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
