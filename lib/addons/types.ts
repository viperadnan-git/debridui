// Stremio Addon Types

export interface AddonManifest {
    id: string;
    name: string;
    version: string;
    description: string;
    logo?: string;
    resources: Array<{
        name: string;
        types: string[];
        idPrefixes?: string[];
    }>;
    types: string[];
    catalogs?: Array<{
        type: string;
        id: string;
        name?: string;
    }>;
    behaviorHints?: {
        adult?: boolean;
        p2p?: boolean;
        configurable?: boolean;
        configurationRequired?: boolean;
    };
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
    folder?: string;
    size?: string;
    peers?: string;
    magnet?: string;
    url?: string;
    isCached?: boolean;
    addonId: string;
    addonName: string;
    addonUrl: string;
}

export interface Addon {
    id: string;
    name: string;
    url: string;
    enabled: boolean;
    order: number;
}

export interface TvSearchParams {
    season: number;
    episode: number;
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
