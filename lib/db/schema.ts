import { relations } from "drizzle-orm";
import { pgTable, text, boolean, integer, timestamp, jsonb, uniqueIndex, index, uuid } from "drizzle-orm/pg-core";
import { AccountType } from "../schemas";
export * from "./auth-schema";
import { user } from "./auth-schema";

// User accounts table - stores debrid service accounts
export const userAccounts = pgTable(
    "user_accounts",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        userId: uuid("user_id")
            .notNull()
            .references(() => user.id, { onDelete: "cascade" }),
        apiKey: text("api_key").notNull(),
        type: text("type", { enum: Object.values(AccountType) as [string, ...string[]] }).notNull(),
        name: text("name").notNull(),
        createdAt: timestamp("created_at").notNull().defaultNow(),
    },
    (table) => [
        uniqueIndex("unique_user_account").on(table.userId, table.apiKey, table.type),
        index("user_accounts_userId_idx").on(table.userId),
    ]
);

// Addons table - stores user addon configurations
export const addons = pgTable(
    "addons",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        userId: uuid("user_id")
            .notNull()
            .references(() => user.id, { onDelete: "cascade" }),
        name: text("name").notNull(),
        url: text("url").notNull(),
        enabled: boolean("enabled").notNull().default(true),
        order: integer("order").notNull().default(0),
    },
    (table) => [index("addons_userId_idx").on(table.userId)]
);

// User settings table - stores user preferences
export const userSettings = pgTable("user_settings", {
    userId: uuid("user_id")
        .primaryKey()
        .references(() => user.id, { onDelete: "cascade" }),
    settings: jsonb("settings").notNull(),
});

// Relations
export const userRelations = relations(user, ({ many, one }) => ({
    userAccounts: many(userAccounts),
    addons: many(addons),
    userSettings: one(userSettings),
}));

export const userAccountsRelations = relations(userAccounts, ({ one }) => ({
    user: one(user, {
        fields: [userAccounts.userId],
        references: [user.id],
    }),
}));

export const addonsRelations = relations(addons, ({ one }) => ({
    user: one(user, {
        fields: [addons.userId],
        references: [user.id],
    }),
}));

export const userSettingsRelations = relations(userSettings, ({ one }) => ({
    user: one(user, {
        fields: [userSettings.userId],
        references: [user.id],
    }),
}));

// Type exports for TypeScript
export type UserAccount = typeof userAccounts.$inferSelect;
export type NewUserAccount = typeof userAccounts.$inferInsert;
export type Addon = typeof addons.$inferSelect;
export type NewAddon = typeof addons.$inferInsert;
export type UserSetting = typeof userSettings.$inferSelect;
export type NewUserSetting = typeof userSettings.$inferInsert;
