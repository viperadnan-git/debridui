"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { addons } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { z } from "zod";
import { addonSchema, addonOrderUpdateSchema } from "@/lib/schemas";
import { type CreateAddon } from "@/lib/types";
import { revalidatePath } from "next/cache";
import { v7 as uuidv7 } from "uuid";

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
export async function addAddon(data: CreateAddon) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        redirect("/login");
    }

    const validated = addonSchema.parse(data);

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
        name: validated.name,
        url: validated.url,
        enabled: validated.enabled,
        order: newOrder,
    });

    revalidatePath("/", "layout");

    return {
        id: newId,
        name: validated.name,
        url: validated.url,
        enabled: validated.enabled,
        order: newOrder,
    };
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

    const validatedId = z.string().min(1, "Addon ID is required").parse(addonId);

    await db.delete(addons).where(and(eq(addons.id, validatedId), eq(addons.userId, session.user.id)));

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

    const validatedId = z.string().min(1, "Addon ID is required").parse(addonId);
    const validatedEnabled = z.boolean({ error: "Enabled must be a boolean" }).parse(enabled);

    await db
        .update(addons)
        .set({ enabled: validatedEnabled })
        .where(and(eq(addons.id, validatedId), eq(addons.userId, session.user.id)));

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

    const validated = addonOrderUpdateSchema.parse(updates);

    await db.transaction(async (tx) => {
        // Defer constraint checking until transaction commit
        await tx.execute(sql`SET CONSTRAINTS unique_user_order DEFERRED`);

        // Directly update each addon to its new order
        for (const update of validated) {
            await tx
                .update(addons)
                .set({ order: update.order })
                .where(and(eq(addons.id, update.id), eq(addons.userId, session.user.id)));
        }
    });

    revalidatePath("/", "layout");
    return { success: true };
}
