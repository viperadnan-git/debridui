import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/lib/db";
import { v7 as uuidv7 } from "uuid";

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "pg",
    }),
    emailAndPassword: {
        enabled: true,
    },
    session: {
        expiresIn: 60 * 60 * 24 * 365, // 1 year in seconds
        updateAge: 60 * 60 * 24 * 7, // Update session every 7 days
        cookieCache: {
            enabled: true,
            maxAge: 60 * 60 * 24, // 24 hours cache
        },
    },
    advanced: {
        database: {
            generateId: () => uuidv7(),
        },
    },
    plugins: [nextCookies()],
});
