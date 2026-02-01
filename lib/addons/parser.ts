import { formatSize } from "../utils";
import { type AddonStream, type AddonSource, SourceQuality, Resolution } from "./types";

const HASH_REGEX = /[a-f0-9]{40}/;
const FILE_SIZE_REGEX = /\b\d+(?:\.\d+)?\s*(?:[KMGT]i?)?B\b/gi;
const RESOLUTION_REGEX = /\b(\d{3,4}p|4k)\b/i;
const CACHED_NAME_REGEX = /instant|\+|✅|⚡/i;
const CACHED_DESC_REGEX = /✅|⚡/;

const QUALITY_REGEXES: [SourceQuality, RegExp][] = [
    // Priority 1: REMUX (highest quality, check first)
    [SourceQuality.BLURAY_REMUX, /(?:^|[\s\[(_.\-])(?:bd|br|b|uhd)?[-_.\\s]?remux(?=[\s\)\]_.\-,]|$)/i],

    // Priority 2: BluRay (check after REMUX to avoid conflicts)
    [
        SourceQuality.BLURAY,
        /(?:^|[\s\[(_.\-])(?:bd|blu[-_.\\s]?ray|(?:bd|br)[-_.\\s]?rip)(?!.*remux)(?=[\s\)\]_.\-,]|$)/i,
    ],

    // Priority 3: WEB formats (very common)
    [SourceQuality.WEB_DL, /(?:^|[\s\[(_.\-])web[-_.\\s]?(?:dl)?(?![-_.\\s]?(?:rip|DLRip|cam))(?=[\s\)\]_.\-,]|$)/i],
    [SourceQuality.WEBRIP, /(?:^|[\s\[(_.\-])web[-_.\\s]?rip(?=[\s\)\]_.\-,]|$)/i],

    // Priority 4: Broadcast formats
    [
        SourceQuality.HDTV,
        /(?:^|[\s\[(_.\-])(?:(?:hd|pd)tv|tv[-_.\\s]?rip|hdtv[-_.\\s]?rip|dsr(?:ip)?|sat[-_.\\s]?rip)(?=[\s\)\]_.\-,]|$)/i,
    ],

    // Priority 5: DVD formats
    [SourceQuality.DVDRIP, /(?:^|[\s\[(_.\-])(?:dvd(?:[-_.\\s]?(?:rip|mux|r|full|5|9))?(?!scr))(?=[\s\)\]_.\-,]|$)/i],

    // Priority 6: HD formats
    [SourceQuality.HDRIP, /(?:^|[\s\[(_.\-])hd[-_.\\s]?rip(?=[\s\)\]_.\-,]|$)/i],
    [SourceQuality.HC_HDRIP, /(?:^|[\s\[(_.\-])hc(?=[\s\)\]_.\-,]|$)/i],

    // Priority 7: Low quality captures
    [SourceQuality.CAM, /(?:^|[\s\[(_.\-])(?:cam(?:[-_.\\s]?rip)?|hdcam)(?=[\s\)\]_.\-,]|$)/i],
    [SourceQuality.TS, /(?:^|[\s\[(_.\-])(?:telesync|ts(?!$)|hd[-_.\\s]?ts|p(?:re)?dvd(?:rip)?)(?=[\s\)\]_.\-,]|$)/i],
    [SourceQuality.TC, /(?:^|[\s\[(_.\-])(?:telecine|tc)(?=[\s\)\]_.\-,]|$)/i],

    // Priority 8: Screeners
    [SourceQuality.SCR, /(?:^|[\s\[(_.\-])(?:(?:dvd|bd|web|hd)?[-_.\\s]?)?scr(?:eener)?(?=[\s\)\]_.\-,]|$)/i],
];

/**
 * Detect video quality from filename
 * @param stream - The stream to analyze
 * @returns The detected quality or undefined
 */
export function detectQuality(stream: AddonStream): SourceQuality | undefined {
    for (const field of ["name", "title", "description"]) {
        const value = stream[field as keyof AddonStream] as string | undefined;
        if (value) {
            for (const [quality, regex] of QUALITY_REGEXES) {
                if (regex.test(value)) {
                    return quality;
                }
            }
        }
    }
    return undefined;
}

/**
 * Detect if a source is cached based on name/description
 * Looks for "Instant", "+" in name, or "✅", "⚡️" in name/description
 */

export function detectCached(stream: AddonStream): boolean {
    return CACHED_NAME_REGEX.test(stream.name || "") || CACHED_DESC_REGEX.test(stream.description || "");
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

const RESOLUTION_MAP: Record<string, Resolution> = {
    "2160p": Resolution.UHD_4K,
    "4k": Resolution.UHD_4K,
    "1440p": Resolution.QHD_1440P,
    "1080p": Resolution.FHD_1080P,
    "720p": Resolution.HD_720P,
    "480p": Resolution.SD_480P,
    "360p": Resolution.SD_360P,
};

export function extractResolution(stream: AddonStream): Resolution | undefined {
    if (!stream.name) return undefined;

    const resolutionMatch = stream.name.match(RESOLUTION_REGEX);
    if (!resolutionMatch) return undefined;

    const resolution = resolutionMatch[0].toLowerCase();
    return RESOLUTION_MAP[resolution];
}
/**
 * Construct magnet link from hash
 */
export function constructMagnet(hash: string, title: string): string {
    return `magnet:?xt=urn:btih:${hash}&dn=${encodeURIComponent(title)}`;
}

/**
 * Parse a single addon stream into AddonSource format
 */
export function parseStream(stream: AddonStream, addonId: string, addonName: string): AddonSource {
    const name = stream.name || "Unknown";
    const title = stream.title || "";
    const description = stream.description || "";

    // Combine title and description
    const combinedDescription = [title, description].filter(Boolean).join("\n");
    const size = extractSize(stream);
    const resolution = extractResolution(stream);
    const quality = detectQuality(stream);
    const hash = extractHash(stream);
    const isCached = detectCached(stream);

    // Construct magnet if we have a hash
    const magnet = hash ? constructMagnet(hash, title) : undefined;

    return {
        title: name,
        description: combinedDescription,
        resolution,
        size,
        quality,
        magnet,
        url: stream.url,
        isCached,
        addonId,
        addonName,
    };
}

/**
 * Parse all streams from an addon response
 */
export function parseStreams(streams: AddonStream[], addonId: string, addonName: string): AddonSource[] {
    return streams.map((stream) => parseStream(stream, addonId, addonName));
}
