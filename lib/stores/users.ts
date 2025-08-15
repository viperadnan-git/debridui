import { create } from "zustand";
import { persist } from "zustand/middleware";
import { User } from "@/lib/types";

interface UserStore {
    users: User[];
    currentUserId: string | null;
    currentUser: User | null;
    isHydrated: boolean;
    
    addAccount: (user: User) => void;
    removeAccount: (userId: string) => void;
    switchAccount: (userId: string) => void;
    updateAccount: (userId: string, user: Partial<User>) => void;
    logout: () => void;
    setHydrated: () => void;
}

export const useUserStore = create<UserStore>()(
    persist(
        (set, get) => ({
            users: [],
            currentUserId: null,
            currentUser: null,
            isHydrated: false,
            
            addAccount: (user) => {
                set((state) => {
                    const exists = state.users.some(u => u.id === user.id);
                    if (exists) {
                        return {
                            users: state.users.map(u => u.id === user.id ? user : u),
                            currentUserId: user.id,
                            currentUser: user
                        };
                    }
                    return {
                        users: [...state.users, user],
                        currentUserId: user.id,
                        currentUser: user
                    };
                });
            },
            
            removeAccount: (userId) => {
                set((state) => {
                    const filteredUsers = state.users.filter(u => u.id !== userId);
                    const isCurrentUser = state.currentUserId === userId;
                    const newCurrentUser = isCurrentUser && filteredUsers.length > 0 
                        ? filteredUsers[0] 
                        : isCurrentUser 
                            ? null 
                            : state.currentUser;
                    
                    return {
                        users: filteredUsers,
                        currentUserId: newCurrentUser?.id || null,
                        currentUser: newCurrentUser
                    };
                });
            },
            
            switchAccount: (userId) => {
                set((state) => {
                    const user = state.users.find(u => u.id === userId);
                    if (!user) return state;
                    
                    return {
                        currentUserId: userId,
                        currentUser: user
                    };
                });
            },
            
            updateAccount: (userId, updates) => {
                set((state) => {
                    const updatedUsers = state.users.map(u => 
                        u.id === userId ? { ...u, ...updates } : u
                    );
                    const updatedUser = updatedUsers.find(u => u.id === userId);
                    
                    return {
                        users: updatedUsers,
                        currentUser: state.currentUserId === userId ? updatedUser || null : state.currentUser
                    };
                });
            },
            
            logout: () => {
                set({
                    currentUserId: null,
                    currentUser: null
                });
            },
            
            setHydrated: () => {
                const { users, currentUserId } = get();
                const currentUser = users.find(u => u.id === currentUserId) || null;
                set({ 
                    isHydrated: true,
                    currentUser,
                    currentUserId: currentUser?.id || null
                });
            }
        }),
        {
            name: "debridui-users",
            partialize: (state) => ({
                users: state.users,
                currentUserId: state.currentUserId
            }),
            onRehydrateStorage: () => (state) => {
                state?.setHydrated();
            }
        }
    )
);