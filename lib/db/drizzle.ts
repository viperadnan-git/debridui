import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as authSchema from "./auth-schema";
import * as schema from "./schema";

export const client = postgres(process.env.DATABASE_URL!, { prepare: false, max: 1 });

export const db = drizzle(client, {
    schema: {
        ...schema,
        ...authSchema,
    },
});

export const upsertUserSettings = (
    executor: Pick<typeof db, "insert">,
    userId: string,
    updates: Record<string, unknown>
) =>
    executor
        .insert(schema.userSettings)
        .values({ userId, settings: updates })
        .onConflictDoUpdate({
            target: schema.userSettings.userId,
            set: {
                settings: sql`COALESCE(${schema.userSettings.settings}, '{}'::jsonb) || ${JSON.stringify(updates)}::jsonb`,
            },
        });
