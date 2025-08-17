"use client";

import { createContext, useContext } from "react";
import { User } from "@/lib/types";
import AllDebridClient from "@/lib/clients/alldebrid";

type AuthContextType = {
    currentUser: User;
    client: AllDebridClient;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function useAuthContext() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error(
            "useAuthContext must be used within AuthContext.Provider"
        );
    }
    return context;
}
