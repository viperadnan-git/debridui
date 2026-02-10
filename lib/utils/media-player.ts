import { MediaPlayer, Platform } from "../types";

declare global {
    interface NavigatorUAData {
        platform: string;
    }
    interface Navigator {
        userAgentData?: NavigatorUAData;
    }
}
import { useSettingsStore } from "../stores/settings";
import { toast } from "sonner";

export interface ParsedUserAgent {
    browser: string;
    os: string;
    device: string;
    platform: Platform;
    /** e.g. "Chrome on macOS" */
    summary: string;
}

const BROWSER_PATTERNS: [RegExp, string][] = [
    [/Edg(?:e|A|iOS)?\/[\d.]+/i, "Edge"],
    [/OPR\/[\d.]+|Opera\/[\d.]+/i, "Opera"],
    [/Brave\/[\d.]+/i, "Brave"],
    [/Vivaldi\/[\d.]+/i, "Vivaldi"],
    [/SamsungBrowser\/[\d.]+/i, "Samsung Internet"],
    [/Firefox\/[\d.]+/i, "Firefox"],
    [/CriOS\/[\d.]+/i, "Chrome"],
    [/FxiOS\/[\d.]+/i, "Firefox"],
    [/Chrome\/[\d.]+/i, "Chrome"],
    [/Safari\/[\d.]+/i, "Safari"],
];

const OS_PATTERNS: [RegExp, string, Platform][] = [
    [/Android\s?[\d.]*/i, "Android", Platform.ANDROID],
    [/iPhone|iPad|iPod/i, "iOS", Platform.IOS],
    [/Mac OS X[\s_][\d._]+|Macintosh/i, "macOS", Platform.MACOS],
    [/Windows NT\s?[\d.]*/i, "Windows", Platform.WINDOWS],
    [/CrOS/i, "Chrome OS", Platform.LINUX],
    [/Linux/i, "Linux", Platform.LINUX],
];

const DEVICE_PATTERNS: [RegExp, string][] = [
    [/iPad/i, "Tablet"],
    [/iPhone/i, "Phone"],
    [/iPod/i, "Phone"],
    [/Android.*Mobile/i, "Phone"],
    [/Android/i, "Tablet"],
    [/Mobile/i, "Phone"],
];

const UNKNOWN_UA: ParsedUserAgent = {
    browser: "Unknown",
    os: "Unknown",
    device: "Desktop",
    platform: Platform.UNKNOWN,
    summary: "Unknown device",
};

export const parseUserAgent = (ua: string | null | undefined): ParsedUserAgent => {
    if (!ua) return UNKNOWN_UA;

    const browser = BROWSER_PATTERNS.find(([re]) => re.test(ua))?.[1] ?? "Unknown";
    const osMatch = OS_PATTERNS.find(([re]) => re.test(ua));
    const os = osMatch?.[1] ?? "Unknown";
    const platform = osMatch?.[2] ?? Platform.UNKNOWN;
    const device = DEVICE_PATTERNS.find(([re]) => re.test(ua))?.[1] ?? "Desktop";

    const summary =
        browser !== "Unknown" && os !== "Unknown"
            ? `${browser} on ${os}`
            : browser !== "Unknown"
              ? browser
              : os !== "Unknown"
                ? os
                : "Unknown device";

    return { browser, os, device, platform, summary };
};

let cachedPlatform: Platform | null = null;

/** Resolve platform via User-Agent Client Hints (reliable on Android tablets in desktop mode) */
const detectViaClientHints = (): Platform | null => {
    const platform = navigator.userAgentData?.platform;
    if (!platform) return null;
    const lower = platform.toLowerCase();
    if (lower === "android") return Platform.ANDROID;
    if (lower === "ios") return Platform.IOS;
    if (lower === "macos" || lower === "macosx") return Platform.MACOS;
    if (lower === "windows") return Platform.WINDOWS;
    if (lower === "linux" || lower === "chromeos") return Platform.LINUX;
    return null;
};

/** Detect the current browser's platform (cached after first call) */
export const detectPlatform = (): Platform => {
    if (cachedPlatform !== null) return cachedPlatform;

    if (typeof navigator === "undefined") {
        cachedPlatform = Platform.UNKNOWN;
        return cachedPlatform;
    }

    // Prefer Client Hints — reports real platform even when UA is spoofed (e.g. Android tablets in desktop mode)
    cachedPlatform = detectViaClientHints() ?? parseUserAgent(navigator.userAgent).platform;
    return cachedPlatform;
};

export const PLAYER_PLATFORM_SUPPORT: Record<MediaPlayer, Platform[]> = {
    [MediaPlayer.BROWSER]: [Platform.ANDROID, Platform.IOS, Platform.MACOS, Platform.WINDOWS, Platform.LINUX],
    [MediaPlayer.IINA]: [Platform.MACOS],
    [MediaPlayer.INFUSE]: [Platform.IOS, Platform.MACOS],
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
    return supportedPlatforms?.includes(currentPlatform) ?? false;
};

const generateVlcUrl = (url: string, fileName: string): string => {
    if (detectPlatform() === Platform.ANDROID) {
        const encodedTitle = encodeURIComponent(fileName);
        const cleanUrl = url.replace("https://", "");
        return `intent://${cleanUrl}#Intent;scheme=https;type=video/*;package=org.videolan.vlc;S.title=${encodedTitle};end`;
    }
    return `vlc://${url}`;
};

const generateMxPlayerUrl = (url: string, packageName: string, fileName: string): string => {
    const encodedTitle = encodeURIComponent(fileName);
    return `intent:${url}#Intent;type=video/*;package=${packageName};S.title=${encodedTitle};end`;
};

type PlayerUrlGenerator = (url: string, fileName: string) => string;

const PLAYER_URLS: Record<Exclude<MediaPlayer, MediaPlayer.BROWSER>, PlayerUrlGenerator> = {
    [MediaPlayer.IINA]: (url) => `iina://weblink?url=${encodeURIComponent(url)}`,
    [MediaPlayer.INFUSE]: (url) => `infuse://x-callback-url/play?url=${encodeURIComponent(url)}`,
    [MediaPlayer.VLC]: (url, fileName) => generateVlcUrl(url, fileName),
    [MediaPlayer.MPV]: (url) => `mpv://${encodeURIComponent(url)}`,
    [MediaPlayer.POTPLAYER]: (url) => `potplayer://${encodeURIComponent(url)}`,
    [MediaPlayer.KODI]: (url) => `kodi://${encodeURIComponent(url)}`,
    [MediaPlayer.MX_PLAYER]: (url, fileName) => generateMxPlayerUrl(url, "com.mxtech.videoplayer.ad", fileName),
    [MediaPlayer.MX_PLAYER_PRO]: (url, fileName) => generateMxPlayerUrl(url, "com.mxtech.videoplayer.pro", fileName),
};

export const openInPlayer = ({
    url,
    fileName,
    player,
}: {
    url: string;
    fileName: string;
    player?: MediaPlayer;
}): void => {
    const selectedPlayer = player || useSettingsStore.getState().get("mediaPlayer");

    if (selectedPlayer === MediaPlayer.BROWSER) {
        toast.error("Browser preview is not supported for this file. Please select a different player.");
        return;
    }

    const playerUrl = PLAYER_URLS[selectedPlayer](url, fileName);
    window.open(playerUrl, "_self");
};
