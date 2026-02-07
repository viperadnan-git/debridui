"use server";

import { cache } from "react";
import { db } from "@/lib/db";
import { playbackHistory } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { recordPlaybackSchema, removePlaybackSchema } from "@/lib/schemas";
import { getPosterUrl } from "@/lib/utils/media";
import { v7 as uuidv7 } from "uuid";
import { z } from "zod";

/**
 * Record a playback in user's history
 * Creates new entry or updates existing one (upsert based on user_id + imdb_id)
 */
export async function recordPlayback(input: z.infer<typeof recordPlaybackSchema>) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        redirect("/login");
    }

    // Validate input with Zod
    const validated = recordPlaybackSchema.parse(input);
    const { imdbId, type, media, tvParams } = validated;

    // Extract and resolve poster URL from images (handles relative Trakt URLs)
    const posterUrl = getPosterUrl(media.images);

    try {
        // Upsert: insert or update if exists
        await db
            .insert(playbackHistory)
            .values({
                id: uuidv7(),
                userId: session.user.id,
                imdbId,
                type,
                title: media.title,
                year: media.year || null,
                posterUrl,
                season: tvParams?.season || null,
                episode: tvParams?.episode || null,
                updatedAt: new Date(),
            })
            .onConflictDoUpdate({
                target: [playbackHistory.userId, playbackHistory.imdbId],
                set: {
                    season: tvParams?.season || null,
                    episode: tvParams?.episode || null,
                    updatedAt: new Date(),
                },
            });

        return { success: true };
    } catch (error) {
        console.error("Failed to record playback:", error);
        throw new Error("Failed to record playback");
    }
}

/**
 * Get user's playback history (most recent 20 entries)
 * Cached per-request to deduplicate DB queries in RSC render tree
 */
export const getPlaybackHistory = cache(async () => {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        return [];
    }

    try {
        const entries = await db
            .select()
            .from(playbackHistory)
            .where(eq(playbackHistory.userId, session.user.id))
            .orderBy(desc(playbackHistory.updatedAt))
            .limit(20);

        return entries;
    } catch (error) {
        console.error("Failed to fetch playback history:", error);
        return [];
    }
});

/**
 * Remove a specific entry from playback history
 */
export async function removeFromPlaybackHistory(input: z.infer<typeof removePlaybackSchema>) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        redirect("/login");
    }

    // Validate input
    const { imdbId } = removePlaybackSchema.parse(input);

    try {
        await db
            .delete(playbackHistory)
            .where(and(eq(playbackHistory.userId, session.user.id), eq(playbackHistory.imdbId, imdbId)));

        return { success: true };
    } catch (error) {
        console.error("Failed to remove playback entry:", error);
        throw new Error("Failed to remove playback entry");
    }
}

/**
 * Clear all playback history for current user
 */
export async function clearPlaybackHistory() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        redirect("/login");
    }

    try {
        await db.delete(playbackHistory).where(eq(playbackHistory.userId, session.user.id));

        return { success: true };
    } catch (error) {
        console.error("Failed to clear playback history:", error);
        throw new Error("Failed to clear playback history");
    }
}
