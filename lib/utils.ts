import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { AccountType } from "./schemas";
import { formatDistanceToNow } from "date-fns";
import { DebridLinkInfo } from "./clients/types";
import { FileType, MediaPlayer } from "./types";

const accountTypeLabels = {
    [AccountType.ALLDEBRID]: "AllDebrid",
};

const extensionToFileType: Record<string, FileType> = {
    // Video
    mp4: FileType.VIDEO,
    mkv: FileType.VIDEO,
    avi: FileType.VIDEO,
    mov: FileType.VIDEO,
    wmv: FileType.VIDEO,
    flv: FileType.VIDEO,
    webm: FileType.VIDEO,
    m4v: FileType.VIDEO,
    m3u8: FileType.VIDEO,
    m3u: FileType.VIDEO,

    // Audio
    mp3: FileType.AUDIO,
    flac: FileType.AUDIO,
    wav: FileType.AUDIO,
    aac: FileType.AUDIO,
    ogg: FileType.AUDIO,
    wma: FileType.AUDIO,
    m4a: FileType.AUDIO,
    opus: FileType.AUDIO,

    // Image
    jpg: FileType.IMAGE,
    jpeg: FileType.IMAGE,
    png: FileType.IMAGE,
    gif: FileType.IMAGE,
    bmp: FileType.IMAGE,
    webp: FileType.IMAGE,
    svg: FileType.IMAGE,
    tiff: FileType.IMAGE,
    ico: FileType.IMAGE,

    // Document
    pdf: FileType.DOCUMENT,
    doc: FileType.DOCUMENT,
    docx: FileType.DOCUMENT,
    txt: FileType.DOCUMENT,
    rtf: FileType.DOCUMENT,
    epub: FileType.DOCUMENT,
    mobi: FileType.DOCUMENT,

    // Archive
    zip: FileType.ARCHIVE,
    rar: FileType.ARCHIVE,
    "7z": FileType.ARCHIVE,
    tar: FileType.ARCHIVE,
    gz: FileType.ARCHIVE,
    bz2: FileType.ARCHIVE,
    xz: FileType.ARCHIVE,
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

export const playUrl = (url: string, player: MediaPlayer) => {
    switch (player) {
        case MediaPlayer.IINA:
            return `iina://weblink?url=${encodeURIComponent(url)}`;
        case MediaPlayer.VLC:
            return `vlc://${encodeURIComponent(url)}`;
        case MediaPlayer.MPV:
            return `mpv://${encodeURIComponent(url)}`;
        case MediaPlayer.POTPLAYER:
            return `potplayer://${encodeURIComponent(url)}`;
        case "kodi":
            return `kodi://${encodeURIComponent(url)}`;
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
    return extensionToFileType[extension.toLowerCase()] || FileType.OTHER;
};
