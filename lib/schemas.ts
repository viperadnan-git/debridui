import { z } from "zod";
import { Resolution, SourceQuality } from "./addons/types";

export enum AccountType {
    REALDEBRID = "real-debrid",
    TORBOX = "torbox",
    ALLDEBRID = "alldebrid",
    PREMIUMIZE = "premiumize",
    DEBRIDLINK = "debrid-link",
}

// Here rather than in types.ts to avoid a circular import
export enum MediaPlayer {
    BROWSER = "Browser",
    IINA = "IINA",
    INFUSE = "Infuse",
    VLC = "VLC",
    MPV = "MPV",
    POTPLAYER = "PotPlayer",
    KODI = "Kodi",
    MX_PLAYER = "MX Player",
    MX_PLAYER_PRO = "MX Player Pro",
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

const streamingResolutionSchema = z.union([z.enum(Resolution), z.literal("any")]);
const streamingSourceQualitySchema = z.union([z.enum(SourceQuality), z.literal("any")]);

export const qualityRangeSchema = z.object({
    minResolution: streamingResolutionSchema,
    maxResolution: streamingResolutionSchema,
    minSourceQuality: streamingSourceQualitySchema,
    maxSourceQuality: streamingSourceQualitySchema,
});

export const streamingSettingsSchema = z.object({
    profileId: z.enum(["max-quality", "high-quality", "balanced", "data-saver", "low-bandwidth", "custom"]),
    customRange: qualityRangeSchema,
    allowUncached: z.boolean(),
    autoPlay: z.boolean(),
});

export const settingsSchema = z.object({
    smartOrder: z.boolean(),
    hideTrash: z.boolean(),
    quickPlay: z.boolean(),
    mediaPlayer: z.enum(MediaPlayer),
    downloadLinkMaxAge: z.number().int().positive(),
    streaming: streamingSettingsSchema,
    tmdbApiKey: serverSettingsSchema.shape.tmdb_api_key.unwrap(),
});

export type DeepPartial<T> = { [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K] };

export function pickValid<T extends z.ZodObject>(schema: T, input: unknown): DeepPartial<z.infer<T>> {
    if (!input || typeof input !== "object" || Array.isArray(input)) return {};
    const out: Record<string, unknown> = {};
    for (const [key, field] of Object.entries(schema.shape)) {
        const value = (input as Record<string, unknown>)[key];
        if (value === undefined) continue;
        const result = field.safeParse(value);
        if (result.success) out[key] = result.data;
        else if (field instanceof z.ZodObject) out[key] = pickValid(field, value);
    }
    return out as DeepPartial<z.infer<T>>;
}
