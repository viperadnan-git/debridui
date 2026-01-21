import { DebridLinkInfo, MediaPlayer, Platform } from "../types";
import { useSettingsStore } from "../stores/settings";
import { toast } from "sonner";

const PLATFORM_PATTERNS = {
    ANDROID: /Android/i,
    IOS: /iPhone|iPad|iPod/i,
    MACOS: /Mac OS X/i,
    WINDOWS: /Windows/i,
    LINUX: /Linux/i,
} as const;

let cachedPlatform: Platform | null = null;

export const detectPlatform = (): Platform => {
    if (cachedPlatform !== null) return cachedPlatform;

    if (typeof navigator === "undefined") {
        cachedPlatform = Platform.UNKNOWN;
        return cachedPlatform;
    }

    const userAgent = navigator.userAgent;

    if (PLATFORM_PATTERNS.ANDROID.test(userAgent)) {
        cachedPlatform = Platform.ANDROID;
    } else if (PLATFORM_PATTERNS.IOS.test(userAgent)) {
        cachedPlatform = Platform.IOS;
    } else if (PLATFORM_PATTERNS.MACOS.test(userAgent)) {
        cachedPlatform = Platform.MACOS;
    } else if (PLATFORM_PATTERNS.WINDOWS.test(userAgent)) {
        cachedPlatform = Platform.WINDOWS;
    } else if (PLATFORM_PATTERNS.LINUX.test(userAgent)) {
        cachedPlatform = Platform.LINUX;
    } else {
        cachedPlatform = Platform.UNKNOWN;
    }

    return cachedPlatform;
};

export const isMobileOrTablet = (): boolean => {
    const platform = detectPlatform();
    return platform === Platform.ANDROID || platform === Platform.IOS;
};

const PLAYER_PLATFORM_SUPPORT: Record<MediaPlayer, Platform[]> = {
    [MediaPlayer.BROWSER]: [Platform.ANDROID, Platform.IOS, Platform.MACOS, Platform.WINDOWS, Platform.LINUX],
    [MediaPlayer.IINA]: [Platform.MACOS],
    [MediaPlayer.VLC]: [Platform.ANDROID, Platform.IOS, Platform.MACOS, Platform.WINDOWS, Platform.LINUX],
    [MediaPlayer.MPV]: [Platform.MACOS, Platform.WINDOWS, Platform.LINUX],
    [MediaPlayer.POTPLAYER]: [Platform.WINDOWS],
    [MediaPlayer.KODI]: [Platform.ANDROID, Platform.IOS, Platform.MACOS, Platform.WINDOWS, Platform.LINUX],
    [MediaPlayer.MX_PLAYER]: [Platform.ANDROID],
    [MediaPlayer.MX_PLAYER_PRO]: [Platform.ANDROID],
};

export const isSupportedPlayer = (player: MediaPlayer, platform?: Platform): boolean => {
    const currentPlatform = platform || detectPlatform();
    const supportedPlatforms = PLAYER_PLATFORM_SUPPORT[player];
    return supportedPlatforms.includes(currentPlatform);
};

const generateVlcUrl = (url: string, fileName?: string): string => {
    if (isMobileOrTablet()) {
        const title = fileName || "Video";
        const encodedTitle = encodeURIComponent(title);
        const cleanUrl = url.replace("https://", "");
        return `intent://${cleanUrl}#Intent;scheme=https;type=video/*;package=org.videolan.vlc;S.title=${encodedTitle};end`;
    }
    return `vlc://${url}`;
};

const generateMxPlayerUrl = (url: string, packageName: string): string => {
    return `intent:${url}#Intent;package=${packageName};S.title=Video;end`;
};

type PlayerUrlGenerator = (url: string, fileName?: string) => string;

const PLAYER_URLS: Record<MediaPlayer, PlayerUrlGenerator> = {
    [MediaPlayer.BROWSER]: (url) => url,
    [MediaPlayer.IINA]: (url) => `iina://weblink?url=${encodeURIComponent(url)}`,
    [MediaPlayer.VLC]: (url, fileName) => generateVlcUrl(url, fileName),
    [MediaPlayer.MPV]: (url) => `mpv://${encodeURIComponent(url)}`,
    [MediaPlayer.POTPLAYER]: (url) => `potplayer://${encodeURIComponent(url)}`,
    [MediaPlayer.KODI]: (url) => `kodi://${encodeURIComponent(url)}`,
    [MediaPlayer.MX_PLAYER]: (url) => generateMxPlayerUrl(url, "com.mxtech.videoplayer.ad"),
    [MediaPlayer.MX_PLAYER_PRO]: (url) => generateMxPlayerUrl(url, "com.mxtech.videoplayer.pro"),
};

export const playUrl = (linkInfo: DebridLinkInfo, player?: MediaPlayer): void => {
    const selectedPlayer = player || useSettingsStore.getState().get("mediaPlayer");
    const currentPlatform = detectPlatform();

    if (!isSupportedPlayer(selectedPlayer, currentPlatform)) {
        const supportedPlatforms = PLAYER_PLATFORM_SUPPORT[selectedPlayer].join(", ");
        toast.error(
            `${selectedPlayer} is not supported on ${currentPlatform}. Supported platforms: ${supportedPlatforms}`
        );
        return;
    }

    const url = PLAYER_URLS[selectedPlayer](linkInfo.link, linkInfo.name);
    window.open(url, "_self");
};
