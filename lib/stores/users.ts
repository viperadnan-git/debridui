import { create } from "zustand";
import { persist } from "zustand/middleware";
import { User } from "@/lib/types";
import { queryClient } from "../query-client";
import { AllDebridClient, getClient, getClientInstance } from "@/lib/clients";
import { toast } from "sonner";

interface UserStore {
    users: User[];
    currentUser: User | null;
    isHydrated: boolean;
    client: AllDebridClient | null;

    addUser: (user: User) => void;
    removeUser: (userId: string) => void;
    switchUser: (userId: string) => void;
    updateUser: (userId: string, user: Partial<User>) => void;
    logout: () => void;
    setHydrated: () => void;
    login: (apiKey: string, type: string) => Promise<User | null>;
    refreshUser: (userId: string) => Promise<void>;
}

export const useUserStore = create<UserStore>()(
    persist(
        (set, get) => ({
            users: [],
            currentUser: null,
            isHydrated: false,
            client: null,

            addUser: (user) => {
                set((state) => {
                    const exists = state.users.some((u) => u.id === user.id);
                    if (exists) {
                        return {
                            users: state.users.map((u) => (u.id === user.id ? user : u)),
                            currentUser: user,
                            client: getClientInstance(user),
                        };
                    }
                    return {
                        users: [...state.users, user],
                        currentUser: user,
                        client: getClientInstance(user),
                    };
                });
            },

            removeUser: (userId) => {
                set((state) => {
                    const filteredUsers = state.users.filter((u) => u.id !== userId);
                    const isCurrentUser = state.currentUser?.id === userId;
                    const newCurrentUser =
                        isCurrentUser && filteredUsers.length > 0
                            ? filteredUsers[0]
                            : isCurrentUser
                              ? null
                              : state.currentUser;

                    return {
                        users: filteredUsers,
                        currentUser: newCurrentUser,
                        client: newCurrentUser ? getClientInstance(newCurrentUser) : null,
                    };
                });
                queryClient.invalidateQueries({ queryKey: [userId] });
            },

            switchUser: (userId) => {
                set((state) => {
                    const user = state.users.find((u) => u.id === userId);
                    if (!user) return state;

                    return {
                        currentUser: user,
                        client: getClientInstance(user),
                    };
                });
            },

            updateUser: (userId, updates) => {
                set((state) => {
                    const updatedUsers = state.users.map((u) => (u.id === userId ? { ...u, ...updates } : u));
                    const updatedUser = updatedUsers.find((u) => u.id === userId);

                    return {
                        users: updatedUsers,
                        currentUser: state.currentUser?.id === userId ? updatedUser || null : state.currentUser,
                    };
                });
            },

            logout: () => {
                set({
                    currentUser: null,
                    users: [],
                });
            },

            setHydrated: () => {
                const { currentUser, users } = get();
                const user = currentUser || users[0];
                const client = getClientInstance(user);
                console.log("Initializing client", user.type);
                set({
                    isHydrated: true,
                    currentUser: user,
                    client,
                });
            },

            login: async (apiKey: string, type: string): Promise<User | null> => {
                try {
                    const ClientClass = getClient({ type });
                    if (!ClientClass) {
                        toast.error("Invalid account type");
                        return null;
                    }

                    const user = await ClientClass.getUser(apiKey);
                    get().addUser(user);
                    toast.success(`Logged in as ${user.username}`);
                    return user;
                } catch (error) {
                    toast.error((error as Error).message || "Failed to authenticate");
                    return null;
                }
            },

            refreshUser: async (userId: string) => {
                const { users, updateUser: updateAccount } = get();
                const user = users.find((u) => u.id === userId);
                if (!user) return;

                try {
                    const ClientClass = getClient({ type: user.type });
                    if (!ClientClass) return;

                    const updatedUser = await ClientClass.getUser(user.apiKey);
                    updateAccount(userId, updatedUser);
                } catch (error) {
                    toast.error(`Failed to refresh user: ${(error as Error).message}`);
                }
            },
        }),
        {
            name: "debridui-users",
            partialize: (state) => ({
                users: state.users,
                currentUser: state.currentUser,
            }),
            onRehydrateStorage: () => (state) => {
                state?.setHydrated();
            },
        }
    )
);
