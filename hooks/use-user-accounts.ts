import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { UserAccount } from "@/lib/db";
import { getClient } from "@/lib/clients";
import { getUserAccounts, addUserAccount, removeUserAccount } from "@/lib/actions/user-accounts";
import { AccountType } from "@/lib/schemas";
import { useToastMutation } from "@/lib/utils/mutation-factory";

const USER_ACCOUNTS_KEY = ["user-accounts"];

// Fetch all user accounts
// `client-swr-dedup` - No need to check session here, called from AuthProvider context
export function useUserAccounts(enabled = true) {
    return useQuery({
        queryKey: USER_ACCOUNTS_KEY,
        queryFn: () => getUserAccounts(),
        enabled,
        staleTime: 1 * 60 * 60 * 1000, // 1 hour
    });
}

// Add a new user account
export function useAddUserAccount() {
    const queryClient = useQueryClient();

    return useToastMutation(
        async (data: { apiKey: string; type: AccountType }) => {
            // Validate with debrid service first
            const user = await getClient({ type: data.type }).getUser(data.apiKey);

            // Save to database using server action
            const account = await addUserAccount({ ...data, name: user.name });

            return { account, user };
        },
        {
            loading: "Adding account...",
            success: ({ user }) => `Added account: ${user.name} (${user.type})`,
            error: "Failed to add account",
        },
        {
            onSuccess: async ({ account, user }) => {
                // Save account ID to localStorage for auto-selection
                localStorage.setItem("selected-account-id", account.id);

                // Cache user info to avoid refetching
                queryClient.setQueryData([account.id, "getUser"], user);

                // Wait for the query to refetch before allowing redirect
                await queryClient.refetchQueries({ queryKey: USER_ACCOUNTS_KEY });
            },
        }
    );
}

// Remove a user account
export function useRemoveUserAccount() {
    const queryClient = useQueryClient();

    return useToastMutation(
        (accountId: string) => removeUserAccount(accountId),
        {
            loading: "Removing account...",
            success: "Account removed",
            error: "Failed to remove account",
        },
        {
            onSuccess: async (_, accountId) => {
                // Invalidate all queries related to this account
                await queryClient.invalidateQueries({ queryKey: [accountId] });

                // Refetch accounts list
                await queryClient.refetchQueries({ queryKey: USER_ACCOUNTS_KEY });
            },
        }
    );
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
        queryKey: [accountId, "getUser"],
        queryFn: () => {
            if (!account) throw new Error("No account provided");
            return getDebridUserInfo(account);
        },
        enabled: !!accountId && !!accountType && !!accountApiKey,
        staleTime: 24 * 60 * 60 * 1000, // 24 hours
        retry: 1,
        refetchOnWindowFocus: false, // Don't refetch on tab focus (data is cached for 24h)
        refetchOnReconnect: false, // Don't refetch on reconnect (data is cached for 24h)
    });
}
