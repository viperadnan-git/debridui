import { formatSize } from "../utils";
import { type AddonStream, type AddonSource } from "./types";

const HASH_REGEX = /[a-f0-9]{40}/;
const FILE_SIZE_REGEX = /\b\d+(?:\.\d+)?\s*(?:[KMGT]i?)?B\b/gi;

/**
 * Detect if a source is cached based on name/description
 * Looks for "Instant", "+" in name, or "✅", "⚡️" in name/description
 */
export function detectCached(stream: AddonStream): boolean {
    const name = stream.name || "";
    const description = stream.description || "";
    const combinedText = `${name} ${description}`;

    // Check name for "instant" or "+"
    const nameCheck = name.toLowerCase().includes("instant") || name.includes("+");

    // Check name and description for emojis
    const emojiCheck = combinedText.includes("✅") || combinedText.includes("⚡");

    return nameCheck || emojiCheck;
}

/**
 * Extract hash from stream (priority: infoHash > bingeGroup)
 * Note: videoHash is a content identifier, not a torrent hash
 */
export function extractHash(stream: AddonStream): string | undefined {
    // Priority 1: Direct infoHash field (standard Torrentio format)
    if (stream.infoHash) {
        return stream.infoHash.toLowerCase();
    }

    // Priority 2: bingeGroup (TorBox format: "torbox|HASH" or direct hash)
    if (stream.behaviorHints?.bingeGroup) {
        const bingeGroup = stream.behaviorHints.bingeGroup.toLowerCase();
        // Try to extract hash pattern from it
        const hashMatch = bingeGroup.match(HASH_REGEX);
        if (hashMatch) {
            return hashMatch[0];
        }
    }

    return undefined;
}

export function extractSize(stream: AddonStream): string | undefined {
    if (stream.behaviorHints?.videoSize) {
        return formatSize(stream.behaviorHints.videoSize);
    }
    if (stream.description) {
        const sizeMatch = stream.description.match(FILE_SIZE_REGEX);
        if (sizeMatch) {
            return sizeMatch[0];
        }
    }
    if (stream.name) {
        const sizeMatch = stream.name.match(FILE_SIZE_REGEX);
        if (sizeMatch) {
            return sizeMatch[0];
        }
    }
    return undefined;
}

/**
 * Construct magnet link from hash
 */
export function constructMagnet(hash: string, title: string): string {
    return `magnet:?xt=urn:btih:${hash}&dn=${encodeURIComponent(title)}`;
}

/**
 * Parse stream name/description - show as-is without parsing
 */
export function parseStreamInfo(stream: AddonStream): {
    title: string;
    folder?: string;
    size?: string;
    peers?: string;
} {
    const name = stream.name || "Unknown";
    const title = stream.title || "";
    const description = stream.description || "";

    // Combine title and description
    const combinedDescription = [title, description].filter(Boolean).join("\n");
    const size = extractSize(stream);

    return {
        title: name,
        folder: combinedDescription || undefined,
        size: size,
        peers: undefined,
    };
}

/**
 * Parse a single addon stream into AddonSource format
 */
export function parseStream(stream: AddonStream, addonId: string, addonName: string, addonUrl: string): AddonSource {
    const { title, folder, size, peers } = parseStreamInfo(stream);
    const hash = extractHash(stream);
    const isCached = detectCached(stream);

    // Construct magnet if we have a hash
    const magnet = hash ? constructMagnet(hash, title) : undefined;

    return {
        title,
        folder,
        size,
        peers,
        magnet,
        url: stream.url,
        isCached,
        addonId,
        addonName,
        addonUrl,
    };
}

/**
 * Parse all streams from an addon response
 */
export function parseStreams(
    streams: AddonStream[],
    addonId: string,
    addonName: string,
    addonUrl: string
): AddonSource[] {
    return streams.map((stream) => parseStream(stream, addonId, addonName, addonUrl));
}
