"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { userAccounts } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { createAccountSchema } from "@/lib/schemas";
import { type CreateAccount } from "@/lib/types";
import { revalidatePath } from "next/cache";
import { v7 as uuidv7 } from "uuid";

/**
 * Get all user accounts for the current authenticated user
 * Note: Returns apiKey because client-side debrid API calls require it
 */
export async function getUserAccounts() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        redirect("/login");
    }

    // `async-defer-await` - Single query, await immediately
    const accounts = await db.select().from(userAccounts).where(eq(userAccounts.userId, session.user.id));

    return accounts;
}

/**
 * Add a new user account
 */
export async function addUserAccount(data: CreateAccount) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        redirect("/login");
    }

    const validated = createAccountSchema.parse(data);

    // Check if account already exists
    const existing = await db
        .select()
        .from(userAccounts)
        .where(
            and(
                eq(userAccounts.userId, session.user.id),
                eq(userAccounts.apiKey, validated.apiKey),
                eq(userAccounts.type, validated.type)
            )
        );

    if (existing.length > 0) {
        return existing[0];
    }

    // Add account to database
    const [account] = await db
        .insert(userAccounts)
        .values({
            id: uuidv7(),
            userId: session.user.id,
            apiKey: validated.apiKey,
            type: validated.type,
            name: validated.name,
        })
        .returning();

    revalidatePath("/", "layout");
    return account;
}

/**
 * Remove a user account (only if owned by current user)
 */
export async function removeUserAccount(accountId: string) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        redirect("/login");
    }

    const validatedId = z.string().min(1, "Account ID is required").parse(accountId);

    const result = await db
        .delete(userAccounts)
        .where(and(eq(userAccounts.id, validatedId), eq(userAccounts.userId, session.user.id)))
        .returning({ id: userAccounts.id });

    if (result.length === 0) {
        throw new Error("Account not found or unauthorized");
    }

    revalidatePath("/", "layout");
    return { success: true };
}
