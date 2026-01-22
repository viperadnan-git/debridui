interface MediaImages {
    poster?: string[];
    fanart?: string[];
    banner?: string[];
}

export function getPosterUrl(images: MediaImages | undefined, fallback?: string): string | null {
    if (images?.poster?.[0]) return `https://${images.poster[0]}`;
    if (images?.fanart?.[0]) return `https://${images.fanart[0]}`;
    if (images?.banner?.[0]) return `https://${images.banner[0]}`;
    return fallback || null;
}

export function getBackdropUrl(images: MediaImages | undefined): string | null {
    if (images?.fanart?.[0]) return `https://${images.fanart[0]}`;
    if (images?.banner?.[0]) return `https://${images.banner[0]}`;
    return null;
}
