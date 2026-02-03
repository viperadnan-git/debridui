import React from "react";
import { MediaPlayer, Platform } from "@/lib/types";

const PLAYER_SETUP_INSTRUCTIONS: Partial<Record<MediaPlayer, (platform: Platform) => React.ReactNode>> = {
    [MediaPlayer.VLC]: (platform) => {
        if (platform === Platform.WINDOWS) {
            return (
                <>
                    If VLC isn&apos;t opening videos, use{" "}
                    <a
                        href="https://github.com/viperadnan-git/protocol-handler-manager?tab=readme-ov-file#installation"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium underline underline-offset-4 hover:text-primary">
                        Protocol Handler Manager
                    </a>{" "}
                    to register the vlc:// protocol.
                </>
            );
        }
        return null;
    },
    [MediaPlayer.MPV]: (platform) => {
        if (platform === Platform.WINDOWS) {
            return (
                <>
                    If MPV isn&apos;t opening videos, use{" "}
                    <a
                        href="https://github.com/viperadnan-git/protocol-handler-manager?tab=readme-ov-file#installation"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium underline underline-offset-4 hover:text-primary">
                        Protocol Handler Manager
                    </a>{" "}
                    to register the mpv:// protocol.
                </>
            );
        }
        return (
            <>
                If MPV isn&apos;t opening videos, open Terminal and run:{" "}
                <code className="rounded bg-muted px-1.5 py-0.5">mpv --register</code>
            </>
        );
    },
};

export const getPlayerSetupInstruction = (player: MediaPlayer, platform: Platform): React.ReactNode => {
    const instructionFn = PLAYER_SETUP_INSTRUCTIONS[player];
    return instructionFn ? instructionFn(platform) : null;
};
