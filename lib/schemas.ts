import { z } from "zod";

export enum AccountType {
    REALDEBRID = "real-debrid",
    TORBOX = "torbox",
    ALLDEBRID = "alldebrid",
}

export const userSchema = z.object({
    id: z.string().trim().min(1).default(crypto.randomUUID()),
    name: z.string().trim().min(1),
    email: z.string().trim().min(1),
    language: z.string().trim().min(1),
    isPremium: z.boolean(),
    premiumExpiresAt: z.date(),
    apiKey: z.string().trim().min(1),
    type: z.enum(Object.values(AccountType)),
});

export const addUserSchema = z.object({
    type: z.enum(Object.values(AccountType)),
    apiKey: z.string().trim().min(1),
});
