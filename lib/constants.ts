import { FileType, AccountType } from "./types";

export const ACCOUNT_TYPE_LABELS = {
    [AccountType.ALLDEBRID]: "AllDebrid",
    [AccountType.TORBOX]: "TorBox",
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
};

export const TRASH_SIZE_THRESHOLD = 1024 * 1024; // 1MB in bytes
export const QUERY_CACHE_MAX_AGE = 1000 * 60 * 60 * 24; // 24 hours
export const QUERY_CACHE_STALE_TIME = 1000 * 60 * 5; // 5 minutes
export const PAGE_SIZE = 50;
export const USER_AGENT = "DebridUI";
export const CAROUSEL_AUTO_DELAY = 3000; // 3 seconds
