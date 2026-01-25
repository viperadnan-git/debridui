import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { UserAccount } from "@/lib/db";
import { getClient } from "@/lib/clients";
import { handleError } from "@/lib/utils/error-handling";
import { getUserAccounts, addUserAccount, removeUserAccount } from "@/lib/actions/user-accounts";
import { AccountType } from "@/lib/schemas";

const USER_ACCOUNTS_KEY = ["user-accounts"];

// Fetch all user accounts
// `client-swr-dedup` - No need to check session here, called from AuthProvider context
export function useUserAccounts(enabled = true) {
    return useQuery({
        queryKey: USER_ACCOUNTS_KEY,
        queryFn: () => getUserAccounts(),
        enabled,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
}

// Add a new user account
export function useAddUserAccount() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: { apiKey: string; type: AccountType }) => {
            // Validate with debrid service first
            const user = await getClient({ type: data.type }).getUser(data.apiKey);

            // Save to database using server action
            const account = await addUserAccount(data);

            return { account, user };
        },
        onSuccess: async ({ account, user }) => {
            // Save account ID to localStorage for auto-selection
            localStorage.setItem("selected-account-id", account.id);

            // Cache user info to avoid refetching
            queryClient.setQueryData(["debrid-user-info", account.id], user);

            // Wait for the query to refetch before allowing redirect
            await queryClient.refetchQueries({ queryKey: USER_ACCOUNTS_KEY });
            toast.success(`Added account: ${user.username} (${user.type})`);
        },
        onError: (error) => {
            handleError(error);
        },
    });
}

// Remove a user account
export function useRemoveUserAccount() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (accountId: string) => removeUserAccount(accountId),
        onSuccess: async (_, accountId) => {
            // Remove cached user info for deleted account
            queryClient.removeQueries({ queryKey: ["debrid-user-info", accountId] });

            // Refetch accounts list
            await queryClient.refetchQueries({ queryKey: USER_ACCOUNTS_KEY });
            toast.success("Account removed");
        },
        onError: (error) => {
            handleError(error);
        },
    });
}

// Get debrid user info for an account
export async function getDebridUserInfo(account: UserAccount) {
    return await getClient({ type: account.type }).getUser(account.apiKey);
}

// Cache debrid user info with React Query
// `rerender-dependencies` - Use primitive ID instead of object
export function useDebridUserInfo(account: UserAccount | null) {
    const accountId = account?.id ?? null;
    const accountType = account?.type;
    const accountApiKey = account?.apiKey;

    return useQuery({
        queryKey: ["debrid-user-info", accountId],
        queryFn: () => {
            if (!account) throw new Error("No account provided");
            return getDebridUserInfo(account);
        },
        enabled: !!accountId && !!accountType && !!accountApiKey,
        staleTime: 24 * 60 * 60 * 1000, // 24 hours
        gcTime: 7 * 24 * 60 * 60 * 1000, // 7 days
        retry: 1,
        refetchOnWindowFocus: false, // Don't refetch on tab focus (data is cached for 24h)
        refetchOnReconnect: false, // Don't refetch on reconnect (data is cached for 24h)
    });
}
