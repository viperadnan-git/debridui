import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { AccountType } from "../schemas";
import { formatDistanceToNow, differenceInYears } from "date-fns";
import { DebridLinkInfo, FileType } from "../types";
import { ACCOUNT_TYPE_LABELS, CORS_PROXY_URL, EXTENSION_TO_FILE_TYPE, STREAMING_STORAGE_KEY } from "../constants";
import { del } from "idb-keyval";
import { queryClient } from "../query-client";
import { toast } from "sonner";

export * from "./color";
export * from "./media-player";

/**
 * Clear all app caches (IndexedDB persistence and in-memory query cache)
 */
export const clearAppCache = async () => {
    await del("DEBRIDUI_CACHE");
    queryClient.clear();
    if (typeof window !== "undefined") {
        localStorage.removeItem(STREAMING_STORAGE_KEY);
    }
};

export const cn = (...inputs: ClassValue[]) => {
    return twMerge(clsx(inputs));
};

export const formatSize = (bytes: number | undefined) => {
    if (!bytes) return "0 B";
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + " " + sizes[i];
};

export const formatAccountType = (type: AccountType | string) => {
    return ACCOUNT_TYPE_LABELS[type as AccountType] || type;
};

export const formatSpeed = (bytesPerSec?: number) => {
    if (!bytesPerSec) return "0 KB/s";
    return `${formatSize(bytesPerSec)}/s`;
};

export const formatRelativeTime = (date: Date) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
};

/**
 * Format date string to year only
 */
export const formatYear = (dateString?: string): number | null => {
    return dateString ? new Date(dateString).getFullYear() : null;
};

/**
 * Format date string to localized date (Month Day, Year)
 */
export const formatLocalizedDate = (dateString?: string): string | null => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
};

/**
 * Calculate age from birth date to end date (or now)
 */
export const calculateAge = (birthDate?: string, endDate?: string): number | null => {
    if (!birthDate) return null;
    const birth = new Date(birthDate);
    const end = endDate ? new Date(endDate) : new Date();
    return differenceInYears(end, birth);
};

export const downloadLinks = (downloads: DebridLinkInfo[]) => {
    const downloadContainer = document.createElement("a");
    downloadContainer.style.display = "none";
    document.body.appendChild(downloadContainer);

    const download = (url: DebridLinkInfo) => {
        downloadContainer.href = url.link;
        downloadContainer.download = url.name;
        downloadContainer.target = "_blank";
        downloadContainer.click();
    };

    const interval = setInterval(() => {
        const url = downloads.pop();
        if (!url) {
            clearInterval(interval);
            document.body.removeChild(downloadContainer);
            return;
        }
        download(url);
    }, 1000);
};

export const copyLinksToClipboard = (links: DebridLinkInfo[]) => {
    const text = links.map((link) => link.link).join("\n");
    navigator.clipboard.writeText(text);
};

export const getFileType = (name: string): FileType => {
    const extension = name.split(".").pop();
    if (!extension) return FileType.OTHER;
    return EXTENSION_TO_FILE_TYPE[extension.toLowerCase()] || FileType.OTHER;
};

/**
 * Checks if a video file or URL is in a non-MP4 format.
 * Non-MP4 formats (MKV, AVI, etc.) may have codec compatibility issues in browsers.
 *
 * @param filenameOrUrl - A filename (e.g., "video.mkv") or URL (e.g., "https://example.com/video.mp4")
 * @returns true if the file is not in MP4 format
 */
export const isNonMP4Video = (filenameOrUrl: string): boolean => {
    return !filenameOrUrl.toLowerCase().endsWith(".mp4");
};

export const getTextFromClipboard = async (): Promise<string | null> => {
    try {
        const text = await navigator.clipboard.readText();
        if (!text.trim()) {
            toast.error("Clipboard is empty");
            return null;
        }
        return text;
    } catch {
        toast.error("Failed to read clipboard");
        return null;
    }
};

export async function chunkedPromise<T>({
    promises,
    chunkSize,
    delay,
}: {
    promises: (() => Promise<T>)[];
    chunkSize: number;
    delay: number;
}): Promise<T[]> {
    const results: T[] = [];

    // Process promises in chunks
    for (let i = 0; i < promises.length; i += chunkSize) {
        // Get the current chunk
        const chunk = promises.slice(i, i + chunkSize);

        // Start timer to track chunk processing time
        const startTime = Date.now();

        // Execute all promises in the current chunk concurrently
        const chunkResults = await Promise.all(chunk.map((promiseFn) => promiseFn()));

        // Add chunk results to the overall results
        results.push(...chunkResults);

        // Calculate time elapsed and remaining delay needed
        const elapsedTime = Date.now() - startTime;
        const remainingDelay = Math.max(0, delay - elapsedTime);

        // If not the last chunk, wait for the remaining delay
        if (i + chunkSize < promises.length && remainingDelay > 0) {
            await new Promise((resolve) => setTimeout(resolve, remainingDelay));
        }
    }

    return results;
}

/**
 * Encode account data for sharing via URL (base64, NOT encryption)
 * WARNING: This is NOT secure - data is fully readable after decoding
 */
export const encodeAccountData = (data: { type: string; apiKey: string }): string => {
    return btoa(JSON.stringify(data));
};

/**
 * Get proxied URL using CORS proxy
 */
export const getProxyUrl = (url: string): string => {
    return `${CORS_PROXY_URL}${encodeURIComponent(url)}`;
};
