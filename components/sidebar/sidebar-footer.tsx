"use client";

import { formatDistanceToNow } from "date-fns";
import { Bug, Clock } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

// Build timestamp - injected at build time via next.config.ts, fallback to current time in dev
const BUILD_TIME = process.env.NEXT_PUBLIC_BUILD_TIME || new Date().toISOString();

export function SidebarFooterContent() {
    const relativeTime = formatDistanceToNow(new Date(BUILD_TIME), { addSuffix: true });

    return (
        <div className="flex flex-col gap-3 p-4">
            {/* Logo Section */}
            <div className="flex items-center justify-center">
                <Image
                    className="dark:invert w-2/3 opacity-80 transition-opacity hover:opacity-100"
                    src="/logo.svg"
                    alt="DebridUI logo"
                    width={160}
                    height={38}
                    priority
                />
            </div>

            <Separator className="bg-sidebar-border/50" />

            {/* Report Bug Button */}
            <Button
                variant="outline"
                size="sm"
                className="w-full bg-sidebar-accent/50 hover:bg-sidebar-accent border-sidebar-border/50 hover:border-sidebar-border transition-all shadow-sm hover:shadow"
                asChild>
                <a href="https://github.com/viperadnan-git/debridui/issues" target="_blank" rel="noopener noreferrer">
                    <Bug className="size-3.5" />
                    Report a Bug
                </a>
            </Button>

            {/* Last Updated Section */}
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground/80">
                <Clock className="size-3.5" />
                <span className="font-medium">Updated {relativeTime}</span>
            </div>
        </div>
    );
}
