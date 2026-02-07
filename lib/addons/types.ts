// Stremio Addon Types

export enum Resolution {
    UHD_4K = "2160p",
    QHD_1440P = "1440p",
    FHD_1080P = "1080p",
    HD_720P = "720p",
    SD_480P = "480p",
    SD_360P = "360p",
}

export enum SourceQuality {
    BLURAY_REMUX = "BluRay REMUX",
    BLURAY = "BluRay",
    WEB_DL = "WEB-DL",
    WEBRIP = "WEBRip",
    HDTV = "HDTV",
    DVDRIP = "DVDRip",
    HDRIP = "HDRip",
    SCR = "SCR",
    TC = "TC",
    TS = "TS",
    CAM = "CAM",
}

export interface AddonManifest {
    id: string;
    name: string;
    version: string;
    description: string;
    logo?: string;
    resources: Array<string | { name: string; types: string[]; idPrefixes?: string[] }>;
    types: string[];
    catalogs?: Array<{
        type: string;
        id: string;
        name?: string;
        extra?: Array<{
            name: string;
            isRequired?: boolean;
            options?: string[];
        }>;
    }>;
    behaviorHints?: {
        adult?: boolean;
        p2p?: boolean;
        configurable?: boolean;
        configurationRequired?: boolean;
    };
}

export interface CatalogMeta {
    id: string;
    type: string;
    name: string;
    poster?: string;
    posterShape?: string;
    description?: string;
    genres?: string[];
    imdbRating?: string;
    releaseInfo?: string;
}

export interface CatalogResponse {
    metas: CatalogMeta[];
}

// Capability detection helpers
export function hasResource(manifest: AddonManifest, name: string): boolean {
    return manifest.resources.some((r) => (typeof r === "string" ? r : r.name) === name);
}

export function hasCatalogs(manifest: AddonManifest): boolean {
    return hasResource(manifest, "catalog") && (manifest.catalogs?.length ?? 0) > 0;
}

export function hasStreams(manifest: AddonManifest): boolean {
    return hasResource(manifest, "stream");
}

export interface AddonStream {
    name?: string;
    title?: string;
    description?: string;
    url?: string;
    infoHash?: string;
    fileIdx?: number;
    behaviorHints?: {
        bingeGroup?: string;
        videoHash?: string;
        filename?: string;
        notWebReady?: boolean;
        videoSize?: number;
    };
}

export interface AddonStreamResponse {
    streams: AddonStream[];
}

export interface AddonSource {
    title: string;
    description?: string;
    size?: string;
    resolution?: Resolution;
    quality?: SourceQuality;
    peers?: string;
    magnet?: string;
    url?: string;
    isCached?: boolean;
    addonId: string;
    addonName: string;
}

export interface Addon {
    id: string; // UUID from database
    name: string;
    url: string;
    enabled: boolean;
    order: number;
}

export interface TvSearchParams {
    season: number;
    episode: number;
    title?: string;
}

export class AddonError extends Error {
    constructor(
        message: string,
        public readonly statusCode?: number,
        public readonly addonId?: string
    ) {
        super(message);
        this.name = "AddonError";
    }
}
