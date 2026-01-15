import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { AccountType } from "../schemas";
import { formatDistanceToNow } from "date-fns";
import { DebridLinkInfo, FileType, MediaPlayer } from "../types";
import { ACCOUNT_TYPE_LABELS, EXTENSION_TO_FILE_TYPE } from "../constants";
import { useSettingsStore } from "../stores/settings";

export const cn = (...inputs: ClassValue[]) => {
    return twMerge(clsx(inputs));
};

export const formatSize = (bytes: number | undefined) => {
    if (!bytes) return "0 B";
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return (bytes / Math.pow(1024, i)).toFixed(2) + " " + sizes[i];
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

const PLAYER_URLS: Record<MediaPlayer, (url: string) => string> = {
    [MediaPlayer.BROWSER]: (url) => url, // Browser preview uses the preview dialog, not external player
    [MediaPlayer.IINA]: (url) => `iina://weblink?url=${encodeURIComponent(url)}`,
    [MediaPlayer.VLC]: (url) => `vlc://${url}`,
    [MediaPlayer.MPV]: (url) => `mpv://${encodeURIComponent(url)}`,
    [MediaPlayer.POTPLAYER]: (url) => `potplayer://${encodeURIComponent(url)}`,
    [MediaPlayer.KODI]: (url) => `kodi://${encodeURIComponent(url)}`,
    [MediaPlayer.MX_PLAYER]: (url) => `intent:${url}#Intent;package=com.mxtech.videoplayer.ad;S.title=undefined;end`,
    [MediaPlayer.MX_PLAYER_PRO]: (url) =>
        `intent:${url}#Intent;package=com.mxtech.videoplayer.pro;S.title=undefined;end`,
    [MediaPlayer.EMBED]: (url) =>
        `https://embed-player.com/video/?source=${encodeURIComponent(url)}&color=%23a1c2c3&preload=metadata`,
};

export const playUrl = (url: string, player?: MediaPlayer) => {
    const selectedPlayer = player || useSettingsStore.getState().get("mediaPlayer");
    return PLAYER_URLS[selectedPlayer](url);
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

export const getTextFromClipboard = async (): Promise<string> => {
    return await navigator.clipboard.readText();
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
