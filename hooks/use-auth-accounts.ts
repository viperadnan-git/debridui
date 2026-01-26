import { useQuery } from "@tanstack/react-query";
import { authClient } from "@/lib/auth-client";

const AUTH_ACCOUNTS_KEY = ["auth-accounts"];

/**
 * Fetch list of authentication accounts (providers) for the current user
 * Used to check if user has a credential (password) account
 */
export function useAuthAccounts() {
    return useQuery({
        queryKey: AUTH_ACCOUNTS_KEY,
        queryFn: async () => {
            const response = await authClient.listAccounts();
            if (response.error) {
                throw new Error(response.error.message || "Failed to fetch accounts");
            }
            return response.data || [];
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
}

/**
 * Check if user has a credential (password) account
 */
export function useHasPassword() {
    const { data: accounts = [], isLoading } = useAuthAccounts();
    const hasPassword = accounts.some((account) => account.providerId === "credential");

    return { hasPassword, isLoading };
}
