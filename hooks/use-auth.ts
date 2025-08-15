import { useEffect, useState, useMemo } from "react";
import { useUserStore } from "@/lib/stores/users";
import { User } from "@/lib/types";
import { getClient } from "@/lib/clients";
import { toast } from "sonner";

export function useAuth() {
    const store = useUserStore();
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        setIsReady(store.isHydrated);
    }, [store.isHydrated]);

    const login = async (
        apiKey: string,
        type: string
    ): Promise<User | null> => {
        try {
            const ClientClass = getClient({ type });
            if (!ClientClass) {
                toast.error("Invalid account type");
                return null;
            }

            const user = await ClientClass.getUser(apiKey);
            store.addAccount(user);
            toast.success(`Logged in as ${user.username}`);
            return user;
        } catch (error) {
            toast.error((error as Error).message || "Failed to authenticate");
            return null;
        }
    };

    const refreshUser = async (userId: string) => {
        const user = store.users.find((u) => u.id === userId);
        if (!user) return;

        try {
            const ClientClass = getClient({ type: user.type });
            if (!ClientClass) return;

            const updatedUser = await ClientClass.getUser(user.apiKey);
            store.updateAccount(userId, updatedUser);
        } catch (error) {
            toast.error(`Failed to refresh user: ${(error as Error).message}`);
        }
    };

    return {
        isReady,
        currentUser: isReady ? store.currentUser : null,
        users: isReady ? store.users : [],
        login,
        logout: store.logout,
        switchAccount: store.switchAccount,
        removeAccount: store.removeAccount,
        refreshUser,
        isAuthenticated: isReady && !!store.currentUser,
    };
}

export function useCurrentUser() {
    const { currentUser, isReady } = useAuth();
    return { user: currentUser, isLoading: !isReady };
}

export function useClient() {
    const { currentUser, isReady } = useAuth();

    const client = useMemo(() => {
        if (!currentUser || !isReady) return null;

        const ClientClass = getClient({ type: currentUser.type });
        if (!ClientClass) return null;

        return new ClientClass(currentUser);
    }, [currentUser, isReady]);

    return client;
}
