import { type ClassValue, clsx } from "clsx";
import { differenceInYears, formatDistanceToNow, formatDuration } from "date-fns";
import { del } from "idb-keyval";
import { toast } from "sonner";
import { twMerge } from "tailwind-merge";
import { ACCOUNT_TYPE_LABELS, CORS_PROXY_URL, EXTENSION_TO_FILE_TYPE, STREAMING_STORAGE_KEY } from "../constants";
import { queryClient } from "../query-client";
import type { AccountType } from "../schemas";
import { type DebridLinkInfo, FileType } from "../types";

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
    return `${parseFloat((bytes / 1024 ** i).toFixed(2))} ${sizes[i]}`;
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

export const formatYear = (dateString?: string): number | null => {
    return dateString ? new Date(dateString).getFullYear() : null;
};

export const formatLocalizedDate = (dateString?: string): string | null => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
};

/**
 * Time left in a single unit, days at the coarsest: "400 days", "5 hours", "20 minutes".
 * Null once the date has passed — the caller words that.
 */
export const formatTimeRemaining = (date: Date | string): string | null => {
    const remainingMs = new Date(date).getTime() - Date.now();
    if (remainingMs <= 0) return null;

    // Rounding cascades up so 23h59m reads "1 day" rather than "24 hours"
    const minutes = Math.round(remainingMs / 60_000);
    if (minutes < 1) return "less than a minute";
    if (minutes < 60) return formatDuration({ minutes });

    const hours = Math.round(minutes / 60);
    if (hours < 24) return formatDuration({ hours });

    return formatDuration({ days: Math.round(hours / 24) });
};

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

    let index = 0;
    const interval = setInterval(() => {
        if (index >= downloads.length) {
            clearInterval(interval);
            document.body.removeChild(downloadContainer);
            return;
        }
        download(downloads[index++]);
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

/** Non-MP4 containers (MKV, AVI) may hit browser codec limits */
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

    for (let i = 0; i < promises.length; i += chunkSize) {
        const chunk = promises.slice(i, i + chunkSize);

        const startTime = Date.now();

        const chunkResults = await Promise.all(chunk.map((promiseFn) => promiseFn()));

        results.push(...chunkResults);

        const elapsedTime = Date.now() - startTime;
        const remainingDelay = Math.max(0, delay - elapsedTime);

        if (i + chunkSize < promises.length && remainingDelay > 0) {
            await new Promise((resolve) => setTimeout(resolve, remainingDelay));
        }
    }

    return results;
}

export const getProxyUrl = (url: string): string => {
    return `${CORS_PROXY_URL}${encodeURIComponent(url)}`;
};
