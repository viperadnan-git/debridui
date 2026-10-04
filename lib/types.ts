import type { z } from "zod";
import {
    AccountType,
    type accountSchema,
    type addonSchema,
    type createAccountSchema,
    type fullAccountSchema,
    MediaPlayer,
    type serverSettingsSchema,
} from "./schemas";

export { AccountType, MediaPlayer };
export type Account = z.infer<typeof accountSchema>;
export type CreateAccount = z.infer<typeof createAccountSchema>;
export type FullAccount = z.infer<typeof fullAccountSchema>;
export type CreateAddon = z.infer<typeof addonSchema>;
export type ServerSettings = z.infer<typeof serverSettingsSchema>;

export enum FileType {
    VIDEO = "video",
    AUDIO = "audio",
    IMAGE = "image",
    DOCUMENT = "document",
    ARCHIVE = "archive",
    TEXT = "text",
    OTHER = "other",
}

export enum Platform {
    ANDROID = "Android",
    IOS = "iOS",
    MACOS = "macOS",
    WINDOWS = "Windows",
    LINUX = "Linux",
    UNKNOWN = "Unknown",
}

// Base type for common properties
type BaseDebridNode = {
    name: string;
    children: DebridNode[];
};

// File node - always has an ID (for download links)
export type DebridFileNode = BaseDebridNode & {
    id: string;
    size: number | undefined;
    type: "file";
};

// Folder node - never has an ID (organizational only)
export type DebridFolderNode = BaseDebridNode & {
    id?: never;
    size: undefined;
    type: "folder";
};

// Discriminated union for type safety
export type DebridNode = DebridFileNode | DebridFolderNode;

export type DebridFile = {
    id: string;
    name: string;
    size: number;

    status: DebridFileStatus;
    progress?: number;
    downloadSpeed?: number;
    uploadSpeed?: number;
    uploaded?: number;
    downloaded?: number;
    peers?: number;

    createdAt: Date;
    completedAt?: Date;

    error?: string;
    files?: DebridNode[];

    // TorBox Airlock: item is exempt from inactivity cleanup
    airlocked?: boolean;
};

export type DebridFileList = {
    files: DebridFile[];
    offset: number;
    limit: number;
    hasMore: boolean;
    total?: number;
};

export type DebridFileStatus =
    | "downloading"
    | "uploading"
    | "seeding"
    | "paused"
    | "completed"
    | "failed"
    | "processing"
    | "waiting"
    | "inactive"
    | "unknown";

export type DebridLinkInfo = {
    link: string;
    name: string;
    size: number;
};

export type OperationResult = {
    success: boolean;
    message: string;
};

export type DebridFileAddStatus = OperationResult & {
    id?: number | string;
    is_cached: boolean;
};

/** Pre-add cache lookup, aligned positionally to the requested infohashes. */
export type CacheCheckResult = {
    hash: string;
    cached: boolean;
    filename: string;
    filesize: string;
    /** No usable answer. Never equivalent to "not cached". */
    unknown?: boolean;
};

/**
 * How a client answers a cache check.
 * - `native`: a dedicated by-hash endpoint, nothing is ever added to the account.
 * - `probe`: no such endpoint, so a tracker-less magnet is added, its status read, then removed.
 */
export type CacheCheckMode = "native" | "probe";

export class DebridError extends Error {
    type?: AccountType;

    constructor(message: string, type?: AccountType) {
        super(type ? `${type}: ${message}` : message);
        this.name = "DebridError";
        this.type = type;
    }
}

export class DebridAuthError extends DebridError {
    constructor(message: string, type?: AccountType) {
        super(message, type);
        this.name = "DebridAuthError";
    }
}

export class DebridRateLimitError extends DebridError {
    retryAfter?: number;

    constructor(message: string, type?: AccountType, retryAfter?: number) {
        super(message, type);
        this.name = "DebridRateLimitError";
        this.retryAfter = retryAfter;
    }
}

// Web download types (unified across clients)
export type WebDownload = {
    id: string;
    name: string;
    originalLink: string;
    downloadLink?: string;
    size?: number;
    status: WebDownloadStatus;
    progress?: number;
    createdAt: Date;
    host?: string;
    error?: string;
    airlocked?: boolean;
};

export type WebDownloadStatus = "pending" | "processing" | "completed" | "failed" | "cached";

export type WebDownloadAddResult = {
    link: string;
    success: boolean;
    downloadLink?: string;
    name?: string;
    size?: number;
    error?: string;
    id?: string;
};

export type WebDownloadList = {
    downloads: WebDownload[];
    offset: number;
    limit: number;
    hasMore: boolean;
    total?: number;
};
