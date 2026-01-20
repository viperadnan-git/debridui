import Image from "next/image";
import Link from "next/link";
import { BookIcon, InfoIcon } from "lucide-react";
import { FlickeringGrid } from "@/components/ui/flickering-grid";

export default function Home() {
    return (
        <div className="relative font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 overflow-hidden">
            {/* Flickering grid background */}
            <div className="absolute inset-0 -z-10">
                <FlickeringGrid
                    className="absolute inset-0"
                    squareSize={4}
                    gridGap={6}
                    color="#e7e7e7"
                    maxOpacity={0.2}
                    flickerChance={0.3}
                />
            </div>

            <main className="flex flex-col gap-[32px] row-start-2 items-center text-center relative z-10">
                <h1 className="font-mono text-xs sm:text-sm tracking-wider uppercase text-foreground/80 font-semibold backdrop-blur-sm bg-background/30 px-6 py-2 rounded-full border border-solid border-foreground/20">
                    Stream · Manage · Discover
                </h1>
                <Image className="dark:invert" src="/logo.svg" alt="DebridUI logo" width={680} height={220} priority />
                <div className="flex gap-4 items-center flex-col sm:flex-row">
                    <Link
                        href="/dashboard"
                        className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:w-auto">
                        Open App
                    </Link>
                    <a
                        className="rounded-full bg-background border border-solid border-black/8 dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 w-auto"
                        href="https://github.com/viperadnan-git/debridui"
                        target="_blank"
                        rel="noopener noreferrer">
                        <div className="flex items-center gap-2">
                            <img
                                height="24"
                                width="24"
                                className="dark:invert"
                                src="https://cdn.jsdelivr.net/npm/simple-icons@v16/icons/github.svg"
                                alt="GitHub"
                            />
                            <span>See on GitHub</span>
                        </div>
                    </a>
                </div>
            </main>
            <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center relative z-10">
                <a
                    className="flex items-center gap-2 hover:underline hover:underline-offset-4"
                    href="https://github.com/viperadnan-git/debridui#readme"
                    target="_blank"
                    rel="noopener noreferrer">
                    <BookIcon className="size-4 text-muted-foreground" />
                    Learn more
                </a>
                <a
                    className="flex items-center gap-2 hover:underline hover:underline-offset-4"
                    href="https://github.com/viperadnan-git/debridui/issues"
                    target="_blank"
                    rel="noopener noreferrer">
                    <InfoIcon className="size-4 text-muted-foreground" />
                    Report an issue →
                </a>
            </footer>
        </div>
    );
}
