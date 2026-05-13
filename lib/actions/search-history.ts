"use server";

import { and, desc, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { v7 as uuidv7 } from "uuid";
import type { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { searchHistory } from "@/lib/db/schema";
import { clearSearchHistorySchema, recordSearchPickSchema, removeSearchPickSchema } from "@/lib/schemas";

const MAX_ENTRIES_RETURNED = 20;

/**
 * Record a search pick. Upserts on (userId, provider, providerId) — clicking the
 * same item twice updates the existing row's `updatedAt` so it floats to the top.
 */
export async function recordSearchPick(input: z.infer<typeof recordSearchPickSchema>) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) redirect("/login");

    const validated = recordSearchPickSchema.parse(input);

    try {
        await db
            .insert(searchHistory)
            .values({
                id: uuidv7(),
                userId: session.user.id,
                provider: validated.provider,
                providerId: validated.providerId,
                title: validated.title,
                metadata: validated.metadata,
                updatedAt: new Date(),
            })
            .onConflictDoUpdate({
                target: [searchHistory.userId, searchHistory.provider, searchHistory.providerId],
                set: {
                    title: validated.title,
                    metadata: validated.metadata,
                    updatedAt: new Date(),
                },
            });

        return { success: true };
    } catch (error) {
        console.error("Failed to record search pick:", error);
        throw new Error("Failed to record search pick");
    }
}

/**
 * Get the user's search history, newest first.
 * `provider` filters to a single provider (e.g. only "trakt" picks).
 * Cached per-request to deduplicate DB queries in RSC render trees.
 */
export const getSearchHistory = cache(async (provider?: string) => {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return [];

    try {
        const where = provider
            ? and(eq(searchHistory.userId, session.user.id), eq(searchHistory.provider, provider))
            : eq(searchHistory.userId, session.user.id);

        return await db
            .select()
            .from(searchHistory)
            .where(where)
            .orderBy(desc(searchHistory.updatedAt))
            .limit(MAX_ENTRIES_RETURNED);
    } catch (error) {
        console.error("Failed to fetch search history:", error);
        return [];
    }
});

/** Remove a single entry by (provider, providerId). */
export async function removeFromSearchHistory(input: z.infer<typeof removeSearchPickSchema>) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) redirect("/login");

    const { provider, providerId } = removeSearchPickSchema.parse(input);

    try {
        await db
            .delete(searchHistory)
            .where(
                and(
                    eq(searchHistory.userId, session.user.id),
                    eq(searchHistory.provider, provider),
                    eq(searchHistory.providerId, providerId)
                )
            );
        return { success: true };
    } catch (error) {
        console.error("Failed to remove search history entry:", error);
        throw new Error("Failed to remove search history entry");
    }
}

/** Clear the current user's search history, optionally scoped to one provider. */
export async function clearSearchHistory(input: z.infer<typeof clearSearchHistorySchema> = {}) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) redirect("/login");

    const { provider } = clearSearchHistorySchema.parse(input);

    try {
        const where = provider
            ? and(eq(searchHistory.userId, session.user.id), eq(searchHistory.provider, provider))
            : eq(searchHistory.userId, session.user.id);

        await db.delete(searchHistory).where(where);
        return { success: true };
    } catch (error) {
        console.error("Failed to clear search history:", error);
        throw new Error("Failed to clear search history");
    }
}
