import React from "react";
import { MediaPlayer, Platform } from "@/lib/types";

const PLAYER_SETUP_INSTRUCTIONS: Partial<Record<MediaPlayer, (platform: Platform) => React.ReactNode>> = {
    [MediaPlayer.VLC]: (platform) => {
        if (platform === Platform.WINDOWS) {
            return (
                <>
                    If VLC isn&apos;t opening videos, you need to set up the protocol handler first.{" "}
                    <a
                        href="https://github.com/stefansundin/vlc-protocol/tree/main/windows"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium underline underline-offset-4 hover:text-primary">
                        Read the instructions
                    </a>
                </>
            );
        }
        return null;
    },
    [MediaPlayer.MPV]: (platform) => {
        const isWindows = platform === Platform.WINDOWS;
        const terminal = isWindows ? "Command Prompt" : "Terminal";
        const adminNote = isWindows ? " as administrator" : "";

        return (
            <>
                If MPV isn&apos;t opening videos, you need to register the protocol handler. Open {terminal}
                {adminNote} and run: <code className="rounded bg-muted px-1.5 py-0.5">mpv --register</code>
                <br />
                <a
                    href="https://mpv.io/manual/stable/#options-register"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium underline underline-offset-4 hover:text-primary">
                    View documentation
                </a>
            </>
        );
    },
};

export const getPlayerSetupInstruction = (player: MediaPlayer, platform: Platform): React.ReactNode => {
    const instructionFn = PLAYER_SETUP_INSTRUCTIONS[player];
    return instructionFn ? instructionFn(platform) : null;
};
