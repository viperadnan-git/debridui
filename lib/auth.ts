import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/lib/db";
import { v7 as uuidv7 } from "uuid";

const isGoogleOAuthEnabled = !!(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "pg",
    }),
    emailAndPassword: {
        enabled: true,
    },
    socialProviders: isGoogleOAuthEnabled
        ? {
              google: {
                  clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
                  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
              },
          }
        : undefined,
    session: {
        expiresIn: 60 * 60 * 24 * 365, // 1 year in seconds
        updateAge: 60 * 60 * 24 * 7, // Update session every 7 days
        cookieCache: {
            enabled: true,
            maxAge: 1 * 60 * 24, // 1 hours cache
        },
    },
    advanced: {
        database: {
            generateId: () => uuidv7(),
        },
        cookiePrefix: "debridui",
    },
    plugins: [nextCookies()],
});
