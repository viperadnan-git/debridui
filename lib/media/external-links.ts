import type { TraktIdType } from "@/lib/trakt";

export interface MediaLink {
    idType: TraktIdType;
    id: string;
    source: string;
    /** Set when the URL names the type; tmdb ids are only unique within one */
    type?: "movie" | "show";
}

/**
 * External media-database URLs a user might paste. Each yields an id Trakt can resolve via
 * idLookup, so a new provider is one row here and nothing downstream changes.
 *
 * Host is matched as `(?:[\w-]+\.)*domain` preceded by a non-word char, so lookalike domains
 * (notimdb.com, imdb.com.phish.co) do not match.
 */
const PROVIDERS: { idType: TraktIdType; source: string; pattern: RegExp; typeFrom?: RegExp }[] = [
    // imdb.com/title/tt0111161 — optional locale segment: imdb.com/de/title/tt0384766
    {
        idType: "imdb",
        source: "IMDb",
        pattern: /(?:^|\W)(?:[\w-]+\.)*imdb\.com\/(?:[a-z]{2}(?:-[a-z]{2})?\/)?title\/(tt\d{7,10})\b/i,
    },
    // themoviedb.org/movie/550 or /tv/1399, with optional -slug suffix
    {
        idType: "tmdb",
        source: "TMDB",
        pattern: /(?:^|\W)(?:[\w-]+\.)*themoviedb\.org\/(?:movie|tv)\/(\d+)/i,
        typeFrom: /themoviedb\.org\/(movie|tv)\//i,
    },
    // thetvdb.com only exposes a numeric id on its dereferrer and legacy query URLs
    {
        idType: "tvdb",
        source: "TheTVDB",
        pattern: /(?:^|\W)(?:[\w-]+\.)*thetvdb\.com\/dereferrer\/(?:series|movie)\/(\d+)/i,
    },
    {
        idType: "tvdb",
        source: "TheTVDB",
        pattern: /(?:^|\W)(?:[\w-]+\.)*thetvdb\.com\/[^\s]*[?&]id=(\d+)/i,
    },
];

export function parseMediaLink(input: string): MediaLink | null {
    for (const { idType, source, pattern, typeFrom } of PROVIDERS) {
        const id = input.match(pattern)?.[1];
        if (!id) continue;
        const segment = typeFrom ? input.match(typeFrom)?.[1]?.toLowerCase() : undefined;
        return { idType, id, source, type: segment ? (segment === "tv" ? "show" : "movie") : undefined };
    }
    return null;
}
