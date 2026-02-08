"use server";

import { db } from "@/lib/db";
import { userSettings } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { serverSettingsSchema } from "@/lib/schemas";
import type { ServerSettings } from "@/lib/types";

/**
 * Get user settings from database
 */
export async function getUserSettings(): Promise<ServerSettings | null> {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        return null;
    }

    try {
        const result = await db.select().from(userSettings).where(eq(userSettings.userId, session.user.id)).limit(1);

        return (result[0]?.settings as ServerSettings) ?? null;
    } catch (error) {
        console.error("Failed to fetch user settings:", error);
        return null;
    }
}

/**
 * Save user settings to database (upsert with JSONB merge)
 */
export async function saveUserSettings(input: Partial<ServerSettings>) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        redirect("/login");
    }

    const updates = serverSettingsSchema.partial().parse(input);

    try {
        const jsonValue = JSON.stringify(updates);
        await db
            .insert(userSettings)
            .values({
                userId: session.user.id,
                settings: updates,
            })
            .onConflictDoUpdate({
                target: userSettings.userId,
                set: {
                    settings: sql`COALESCE(${userSettings.settings}, '{}'::jsonb) || ${jsonValue}::jsonb`,
                },
            });

        return { success: true };
    } catch (error) {
        console.error("Failed to save user settings:", error);
        throw new Error("Failed to save user settings");
    }
}
