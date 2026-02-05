import { type MediaImages } from "@/lib/trakt";

// Handles both relative paths (Trakt/fanart.tv) and full URLs (Stremio addons)
function resolveImageUrl(url: string): string {
    return url.startsWith("http") ? url : `https://${url}`;
}

export function getPosterUrl(images: MediaImages | undefined, fallback?: string): string | null {
    if (images?.poster?.[0]) return resolveImageUrl(images.poster[0]);
    if (images?.fanart?.[0]) return resolveImageUrl(images.fanart[0]);
    if (images?.banner?.[0]) return resolveImageUrl(images.banner[0]);
    return fallback || null;
}

export function getBackdropUrl(images: MediaImages | undefined): string | null {
    if (images?.fanart?.[0]) return resolveImageUrl(images.fanart[0]);
    if (images?.banner?.[0]) return resolveImageUrl(images.banner[0]);
    return null;
}
