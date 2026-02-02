import { z } from "zod";
import { AccountType, userSchema } from "./schemas";

export { AccountType };
export type User = z.infer<typeof userSchema>;

export enum FileType {
    VIDEO = "video",
    AUDIO = "audio",
    IMAGE = "image",
    DOCUMENT = "document",
    ARCHIVE = "archive",
    TEXT = "text",
    OTHER = "other",
}

export enum MediaPlayer {
    BROWSER = "Browser",
    IINA = "IINA",
    INFUSE = "Infuse",
    VLC = "VLC",
    MPV = "MPV",
    POTPLAYER = "PotPlayer",
    KODI = "Kodi",
    MX_PLAYER = "MX Player",
    MX_PLAYER_PRO = "MX Player Pro",
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

// Type guard to check if a node is a file
export function isFileNode(node: DebridNode): node is DebridFileNode {
    return node.type === "file";
}

// Type guard to check if a node is a folder
export function isFolderNode(node: DebridNode): node is DebridFolderNode {
    return node.type === "folder";
}

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
