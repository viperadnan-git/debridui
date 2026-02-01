import { type AddonSource } from "@/lib/addons/types";
import { getResolutionIndex, getSourceQualityIndex } from "@/lib/addons/parser";
import { type QualityRange, type StreamingSettings, getActiveRange } from "@/lib/stores/settings";

function matchesResolutionRange(source: AddonSource, range: QualityRange): boolean {
    if (!source.resolution) return true; // Unknown resolution passes

    const sourceIndex = getResolutionIndex(source.resolution);
    // Lower index = better resolution
    const minIndex = range.maxResolution === "any" ? 0 : getResolutionIndex(range.maxResolution);
    const maxIndex = range.minResolution === "any" ? Infinity : getResolutionIndex(range.minResolution);

    return sourceIndex >= minIndex && sourceIndex <= maxIndex;
}

function matchesSourceQualityRange(source: AddonSource, range: QualityRange): boolean {
    if (!source.quality) return true; // Unknown quality passes

    const sourceIndex = getSourceQualityIndex(source.quality);
    // Lower index = better quality
    const minIndex = range.maxSourceQuality === "any" ? 0 : getSourceQualityIndex(range.maxSourceQuality);
    const maxIndex = range.minSourceQuality === "any" ? Infinity : getSourceQualityIndex(range.minSourceQuality);

    return sourceIndex >= minIndex && sourceIndex <= maxIndex;
}

export interface SelectionResult {
    source: AddonSource | null;
    isCached: boolean;
    hasMatches: boolean;
    cachedMatches: AddonSource[];
    uncachedMatches: AddonSource[];
}

export function selectBestSource(sources: AddonSource[], settings: StreamingSettings): SelectionResult {
    const range = getActiveRange(settings);

    // Filter sources that match preferences
    const matchingSources = sources.filter(
        (source) =>
            source.url && // Must have a playable URL
            matchesResolutionRange(source, range) &&
            matchesSourceQualityRange(source, range)
    );

    // Separate cached and uncached
    const cachedMatches = matchingSources.filter((s) => s.isCached);
    const uncachedMatches = matchingSources.filter((s) => !s.isCached);

    // Sort function: by resolution (lower index = better), then by source quality (lower index = better)
    const sortByPriority = (a: AddonSource, b: AddonSource) => {
        const resolutionDiff = getResolutionIndex(a.resolution) - getResolutionIndex(b.resolution);
        if (resolutionDiff !== 0) return resolutionDiff;

        return getSourceQualityIndex(a.quality) - getSourceQualityIndex(b.quality);
    };

    cachedMatches.sort(sortByPriority);
    uncachedMatches.sort(sortByPriority);

    // Prefer cached sources
    if (cachedMatches.length > 0) {
        return {
            source: cachedMatches[0],
            isCached: true,
            hasMatches: true,
            cachedMatches,
            uncachedMatches,
        };
    }

    // Fallback to uncached
    if (uncachedMatches.length > 0) {
        return {
            source: uncachedMatches[0],
            isCached: false,
            hasMatches: true,
            cachedMatches,
            uncachedMatches,
        };
    }

    return {
        source: null,
        isCached: false,
        hasMatches: false,
        cachedMatches: [],
        uncachedMatches: [],
    };
}
