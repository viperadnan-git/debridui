import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { AccountType } from "../schemas";
import { formatDistanceToNow } from "date-fns";
import { DebridLinkInfo, FileType, MediaPlayer } from "../types";
import { ACCOUNT_TYPE_LABELS, EXTENSION_TO_FILE_TYPE } from "../constants";

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

export const playUrl = (url: string, player: MediaPlayer) => {
    switch (player) {
        case MediaPlayer.IINA:
            return `iina://weblink?url=${encodeURIComponent(url)}`;
        case MediaPlayer.VLC:
            return `vlc://${url}`;
        case MediaPlayer.MPV:
            return `mpv://${encodeURIComponent(url)}`;
        case MediaPlayer.POTPLAYER:
            return `potplayer://${encodeURIComponent(url)}`;
        case MediaPlayer.KODI:
            return `kodi://${encodeURIComponent(url)}`;
        case MediaPlayer.MX_PLAYER:
            return `intent:${url}#Intent;package=com.mxtech.videoplayer.ad;S.title=undefined;end`;
        case MediaPlayer.MX_PLAYER_PRO:
            return `intent:${url}#Intent;package=com.mxtech.videoplayer.pro;S.title=undefined;end`;
        default:
            return `https://embed-player.com/video/?source=${encodeURIComponent(
                url
            )}&color=%23a1c2c3&preload=metadata`;
    }
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
