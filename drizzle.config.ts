import { defineConfig } from "drizzle-kit";
import { config as loadEnv } from "dotenv";

// Drizzle Kit doesn't automatically load Next.js env files.
// Load `.env.local` (dev) and fall back to `.env` if present.
loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

export default defineConfig({
    schema: ["./lib/db/schema.ts", "./lib/db/auth-schema.ts"],
    out: "./drizzle",
    dialect: "postgresql",
    dbCredentials: {
        url: process.env.DATABASE_URL!,
    },
});
