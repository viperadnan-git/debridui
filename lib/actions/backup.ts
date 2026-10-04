"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { v7 as uuidv7 } from "uuid";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { backupSections } from "@/lib/backup";
import { db, upsertUserSettings } from "@/lib/db";
import { addons, userAccounts } from "@/lib/db/schema";

const restoreSchema = z.object(backupSections).omit({ preferences: true }).partial();

export async function restoreBackup(input: z.input<typeof restoreSchema>) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        redirect("/login");
    }

    const userId = session.user.id;
    const data = restoreSchema.parse(input);

    const result = await db.transaction(async (tx) => {
        let addedAddons = 0;
        let addedAccounts = 0;

        if (data.addons?.length) {
            const existing = await tx
                .select({ url: addons.url, order: addons.order })
                .from(addons)
                .where(eq(addons.userId, userId));
            const seen = new Set(existing.map((a) => a.url));
            let order = Math.max(-1, ...existing.map((a) => a.order)) + 1;
            const rows = data.addons
                .filter((a) => !seen.has(a.url) && seen.add(a.url))
                .map((a) => ({ id: uuidv7(), userId, name: a.name, url: a.url, enabled: a.enabled, order: order++ }));
            if (rows.length) await tx.insert(addons).values(rows);
            addedAddons = rows.length;
        }

        if (data.accounts?.length) {
            const inserted = await tx
                .insert(userAccounts)
                .values(
                    data.accounts.map((a) => ({ id: uuidv7(), userId, apiKey: a.apiKey, type: a.type, name: a.name }))
                )
                .onConflictDoNothing()
                .returning({ id: userAccounts.id });
            addedAccounts = inserted.length;
        }

        if (data.integrations && Object.keys(data.integrations).length) {
            await upsertUserSettings(tx, userId, data.integrations);
        }

        return { addedAddons, addedAccounts };
    });

    revalidatePath("/", "layout");
    return result;
}
