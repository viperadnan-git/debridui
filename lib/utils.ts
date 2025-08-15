import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { AccountType } from "./schemas";
import { formatDistanceToNow } from "date-fns";
import { DebridLinkInfo } from "./clients/types";
import { FileType } from "./types";

const accountTypeLabels = {
    [AccountType.ALLDEBRID]: "AllDebrid",
};

const extensionToFileType = {
    mp4: FileType.VIDEO,
    mkv: FileType.VIDEO,
    avi: FileType.VIDEO,
    mov: FileType.VIDEO,
    wmv: FileType.VIDEO,
    flv: FileType.VIDEO,
    webm: FileType.VIDEO,
    m4v: FileType.VIDEO,
    m4a: FileType.VIDEO,
    m3u8: FileType.VIDEO,
    m3u: FileType.VIDEO,
};

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
    return accountTypeLabels[type as AccountType] || type;
};

export const formatSpeed = (bytesPerSec?: number) => {
    if (!bytesPerSec) return "0 KB/s";
    return `${formatSize(bytesPerSec)}/s`;
};

export const formatRelativeTime = (date: Date) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
};

export const playUrl = (url: string, player: string) => {
    switch (player) {
        case "iina":
            return `iina://weblink?url=${encodeURIComponent(url)}`;
        case "vlc":
            return `vlc://${encodeURIComponent(url)}`;
        case "mpv":
            return `mpv://${encodeURIComponent(url)}`;
        case "potplayer":
            return `potplayer://${encodeURIComponent(url)}`;
        case "kodi":
            return `kodi://${encodeURIComponent(url)}`;
        default:
            return `vlc://${encodeURIComponent(url)}`;
    }
};

export const downloadLinks = (downloads: DebridLinkInfo[]) => {
    for (const download of downloads) {
        // initiate download in browser
        const a = document.createElement("a");
        a.href = download.link;
        a.download = download.name;
        a.click();
    }
};

export const copyLinksToClipboard = (links: DebridLinkInfo[]) => {
    const text = links.map((link) => link.link).join("\n");
    navigator.clipboard.writeText(text);
};

export const getFileType = (name: string) => {
    const extension = name.split(".").pop();
    if (!extension) return FileType.OTHER;
    return (
        extensionToFileType[extension.toLowerCase() as keyof typeof extensionToFileType] ||
        FileType.OTHER
    );
};
