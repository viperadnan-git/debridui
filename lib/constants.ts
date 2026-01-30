import { FileType, AccountType } from "./types";

export const ACCOUNT_TYPE_LABELS = {
    [AccountType.REALDEBRID]: "Real-Debrid",
    [AccountType.TORBOX]: "TorBox",
    [AccountType.ALLDEBRID]: "AllDebrid",
};

export const ACCOUNT_TYPE_ICONS: Record<AccountType, string> = {
    [AccountType.REALDEBRID]: "https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/png/real-debrid.png",
    [AccountType.TORBOX]: "https://wsrv.nl/?url=https://i.ibb.co/YgB6zFK/icon.png&w=280&h=280&maxage=1y",
    [AccountType.ALLDEBRID]: "https://wsrv.nl/?url=https://i.ibb.co/tTDfYx0v/icon.jpg&w=280&h=280&maxage=1y",
};

export const EXTENSION_TO_FILE_TYPE: Record<string, FileType> = {
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

    // Text
    txt: FileType.TEXT,
    nfo: FileType.TEXT,
    md: FileType.TEXT,
    markdown: FileType.TEXT,

    // Subtitles
    srt: FileType.TEXT,
    vtt: FileType.TEXT,
    ass: FileType.TEXT,
    ssa: FileType.TEXT,
    sub: FileType.TEXT,
    sbv: FileType.TEXT,
    scc: FileType.TEXT,
};

export const TRASH_SIZE_THRESHOLD = 1024 * 1024; // 1MB in bytes

export const QUERY_CACHE_STALE_TIME = 1000 * 60 * 60; // 1 hour
export const QUERY_CACHE_GC_TIME = 1000 * 60 * 60 * 24 * 7; // 7 days
export const QUERY_CACHE_IDB_MAX_AGE = 1000 * 60 * 60 * 24 * 7; // 7 days

export const PAGE_SIZE = 50;
export const WEB_DOWNLOADS_PAGE_SIZE = 50;
export const USER_AGENT = "DebridUI";
export const CAROUSEL_AUTO_DELAY = 3000; // 3 seconds

// External links
export const DISCORD_URL = process.env.NEXT_PUBLIC_DISCORD_URL;
export const CORS_PROXY_URL = process.env.NEXT_PUBLIC_CORS_PROXY_URL || "https://corsproxy.io/?url=";

// Auth config - raw values for Docker runtime env injection
// These values are stored as-is (not compared) so that sed can replace placeholders at container startup
// Comparisons must happen at runtime in components, NOT here (otherwise they'd be evaluated at build time)
export const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";
export const DISABLE_EMAIL_SIGNUP = process.env.NEXT_PUBLIC_DISABLE_EMAIL_SIGNUP ?? "";
