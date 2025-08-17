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
    OTHER = "other",
}

export enum MediaPlayer {
    IINA = "iina",
    VLC = "vlc",
    MPV = "mpv",
    POTPLAYER = "potplayer",
    KODI = "kodi",
    MX_PLAYER = "mxplayer",
    MX_PLAYER_PRO = "mxplayerpro",
    EMBED = "embed",
}

export type DebridFileNode = {
    id?: string;
    name: string;
    size: number | undefined;
    type: "file" | "folder";
    children: DebridFileNode[];
};

export type DebridFile = {
    id: string;
    name: string;
    size: number;

    status: DebridFileStatus;
    progress?: number | string;
    downloadSpeed?: number;
    uploadSpeed?: number;
    uploaded?: number;
    downloaded?: number;
    peers?: number;

    createdAt: Date;
    completedAt?: Date;

    error?: string;
};

export type DebridFileList = {
    files: DebridFile[];
    offset: number;
    limit: number;
    hasMore: boolean;
};

export type DebridFileStatus =
    | "downloading"
    | "uploading"
    | "seeding"
    | "paused"
    | "completed"
    | "failed"
    | "unknown"
    | "waiting";

export type DebridLinkInfo = {
    link: string;
    name: string;
    size: number;
};
