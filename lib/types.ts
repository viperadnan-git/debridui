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
    EMBED = "embed",
}

