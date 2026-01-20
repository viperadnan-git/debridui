import { create } from "zustand";
import { persist } from "zustand/middleware";
import { User } from "@/lib/types";
import { queryClient } from "../query-client";
import { getClient } from "@/lib/clients";
import { toast } from "sonner";
import { handleError } from "@/lib/utils/error-handling";

interface UserStore {
    users: User[];
    currentUser?: User;
    isHydrated: boolean;

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
            currentUser: undefined,
            isHydrated: false,

            addUser: (user) => {
                set((state) => {
                    const existingUser = state.users.find(
                        (u) => u.id === user.id || (u.type === user.type && u.apiKey === user.apiKey)
                    );
                    if (existingUser) {
                        // Update existing user and switch to it
                        const updatedUser = { ...existingUser, ...user };
                        return {
                            users: state.users.map((u) => (u.id === existingUser.id ? updatedUser : u)),
                            currentUser: updatedUser,
                        };
                    }
                    return {
                        users: [...state.users, user],
                        currentUser: user,
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
                              ? undefined
                              : state.currentUser;

                    return {
                        users: filteredUsers,
                        currentUser: newCurrentUser,
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
                    };
                });
            },

            updateUser: (userId, updates) => {
                set((state) => {
                    const updatedUsers = state.users.map((u) => (u.id === userId ? { ...u, ...updates } : u));
                    const updatedUser = updatedUsers.find((u) => u.id === userId);

                    return {
                        users: updatedUsers,
                        currentUser: state.currentUser?.id === userId ? updatedUser || undefined : state.currentUser,
                    };
                });
            },

            logout: () => {
                set({
                    currentUser: undefined,
                    users: [],
                });
            },

            setHydrated: () => {
                const { currentUser, users } = get();
                const user = currentUser || users[0];

                if (!user) {
                    set({ isHydrated: true });
                    return;
                }

                console.log("Initializing client", user.type);
                set({
                    isHydrated: true,
                    currentUser: user,
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
                    handleError(error, "Failed to authenticate");
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
                    handleError(error, "Failed to refresh user");
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
