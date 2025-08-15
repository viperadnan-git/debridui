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

export const mediaPlayers = [
    { value: MediaPlayer.EMBED, label: "Embed Player" },
    { value: MediaPlayer.VLC, label: "VLC Media Player" },
    { value: MediaPlayer.IINA, label: "IINA" },
    { value: MediaPlayer.MPV, label: "MPV" },
    { value: MediaPlayer.POTPLAYER, label: "PotPlayer" },
    { value: MediaPlayer.KODI, label: "Kodi" },
];