"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { addons } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { v7 as uuidv7 } from "uuid";
import { type Addon } from "@/lib/addons/types";

/**
 * Get all user addons from database
 */
export async function getUserAddons() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        redirect("/login");
    }

    const userAddons = await db.select().from(addons).where(eq(addons.userId, session.user.id)).orderBy(addons.order);

    return userAddons;
}

/**
 * Add a new addon
 */
export async function addAddon(addon: Omit<Addon, "id" | "order">) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        redirect("/login");
    }

    // Calculate next order atomically
    const [maxOrder] = await db
        .select({ max: sql<number>`COALESCE(MAX(${addons.order}), -1)` })
        .from(addons)
        .where(eq(addons.userId, session.user.id));

    const newOrder = (maxOrder?.max ?? -1) + 1;
    const newId = uuidv7();

    await db.insert(addons).values({
        id: newId,
        userId: session.user.id,
        name: addon.name,
        url: addon.url,
        enabled: addon.enabled,
        order: newOrder,
    });

    revalidatePath("/", "layout");

    return {
        id: newId,
        name: addon.name,
        url: addon.url,
        enabled: addon.enabled,
        order: newOrder,
    } satisfies Addon;
}

/**
 * Remove an addon
 */
export async function removeAddon(addonId: string) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        redirect("/login");
    }

    await db.delete(addons).where(and(eq(addons.id, addonId), eq(addons.userId, session.user.id)));

    revalidatePath("/", "layout");
    return { success: true };
}

/**
 * Toggle addon enabled status
 */
export async function toggleAddon(addonId: string, enabled: boolean) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        redirect("/login");
    }

    await db
        .update(addons)
        .set({ enabled })
        .where(and(eq(addons.id, addonId), eq(addons.userId, session.user.id)));

    revalidatePath("/", "layout");
    return { success: true };
}

/**
 * Update addon orders (for reordering)
 * Uses deferrable constraint to allow swapping without conflicts
 */
export async function updateAddonOrders(updates: { id: string; order: number }[]) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        redirect("/login");
    }

    await db.transaction(async (tx) => {
        // Defer constraint checking until transaction commit
        await tx.execute(sql`SET CONSTRAINTS unique_user_order DEFERRED`);

        // Directly update each addon to its new order
        for (const update of updates) {
            await tx
                .update(addons)
                .set({ order: update.order })
                .where(and(eq(addons.id, update.id), eq(addons.userId, session.user.id)));
        }
    });

    revalidatePath("/", "layout");
    return { success: true };
}
