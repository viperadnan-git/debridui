"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";

/**
 * Set password for users who don't have one (OAuth users)
 * Requires a fresh session token (user must have signed in recently)
 */
export async function setPassword(newPassword: string) {
    try {
        const result = await auth.api.setPassword({
            body: {
                newPassword,
            },
            headers: await headers(),
            query: {
                disableCookieCache: true,
            },
        });

        if (!result) {
            return { success: false, error: "Failed to set password" };
        }

        return { success: true };
    } catch (error) {
        console.error("Error setting password:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to set password",
        };
    }
}
