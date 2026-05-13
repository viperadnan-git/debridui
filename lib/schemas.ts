import { z } from "zod";

export enum AccountType {
    REALDEBRID = "real-debrid",
    TORBOX = "torbox",
    ALLDEBRID = "alldebrid",
    PREMIUMIZE = "premiumize",
}

// Account schemas (base → inherited)
export const accountSchema = z.object({
    type: z.enum(AccountType, { error: "Invalid account type" }),
    apiKey: z.string().trim().min(1, "API key is required"),
});

export const createAccountSchema = accountSchema.extend({
    name: z.string().trim().min(1, "Account name is required"),
});

export const fullAccountSchema = accountSchema.extend({
    id: z.string().trim().min(1).default(crypto.randomUUID()),
    name: z.string().trim().min(1),
    email: z.string().trim().min(1),
    language: z.string().trim().min(1),
    isPremium: z.boolean(),
    premiumExpiresAt: z.date(),
});

// Addon schemas
export const addonSchema = z.object({
    name: z.string().trim().min(1, "Addon name is required"),
    url: z.url("Invalid addon URL").trim(),
    enabled: z.boolean(),
});

export const addonOrderUpdateSchema = z.array(
    z.object({
        id: z.string().min(1, "Addon ID is required"),
        order: z.number().int().min(0, "Order must be a non-negative integer"),
    })
);

// Playback history schemas
export const tvParamsSchema = z
    .object({
        season: z.number().int().positive("Season must be positive"),
        episode: z.number().int().positive("Episode must be positive"),
    })
    .optional();

export const mediaSchema = z.object({
    title: z.string().min(1, "Title is required"),
    year: z.number().int().positive().optional(),
    images: z
        .object({
            poster: z.array(z.string()).optional(),
        })
        .optional(),
});

export const recordPlaybackSchema = z.object({
    imdbId: z.string().regex(/^tt\d+$/, "Invalid IMDb ID format"),
    type: z.enum(["movie", "show"], { message: "Type must be 'movie' or 'show'" }),
    media: mediaSchema,
    tvParams: tvParamsSchema,
});

export const removePlaybackSchema = z.object({
    imdbId: z.string().regex(/^tt\d+$/, "Invalid IMDb ID format"),
});

// Search history schemas — polymorphic by provider via a discriminated union.
// Adding a new provider (e.g. "file") is a new entry in the union below.
const traktSearchPickSchema = z.object({
    provider: z.literal("trakt"),
    providerId: z.string().min(1),
    title: z.string().min(1),
    metadata: z.object({
        kind: z.literal("trakt"),
        type: z.enum(["movie", "show"]),
        slug: z.string().optional(),
        imdbId: z.string().optional(),
        year: z.number().int().optional(),
        rating: z.number().optional(),
        posterUrl: z.string().optional(),
        subtitle: z.string().optional(),
    }),
});

export const recordSearchPickSchema = z.discriminatedUnion("provider", [traktSearchPickSchema]);

export const removeSearchPickSchema = z.object({
    provider: z.string().min(1),
    providerId: z.string().min(1),
});

export const clearSearchHistorySchema = z.object({
    provider: z.string().min(1).optional(),
});

// User settings schema (snake_case for DB storage)
export const serverSettingsSchema = z.object({
    tmdb_api_key: z.string().max(256).optional(),
});
