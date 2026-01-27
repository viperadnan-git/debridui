"use client";

import { type TraktMedia } from "@/lib/trakt";

interface MediaStatsProps {
    media: TraktMedia;
    type: "movie" | "show";
}

type Stat = {
    value: string;
    label: string;
};

export function MediaStats({ media, type }: MediaStatsProps) {
    const stats = [
        media.language && {
            label: "Language",
            value: media.language.toUpperCase(),
        },
        media.country && {
            label: "Country",
            value: media.country.toUpperCase(),
        },
        type === "show" &&
            media.aired_episodes && {
                label: "Episodes",
                value: media.aired_episodes.toString(),
            },
        media.status && {
            label: "Status",
            value: media.status.charAt(0).toUpperCase() + media.status.slice(1).toLowerCase(),
        },
    ].filter(Boolean) as Stat[];

    if (stats.length === 0) return null;

    return (
        <div className="flex flex-wrap gap-6 pt-2">
            {stats.map((stat) => (
                <div key={stat.label} className="pl-3 border-l border-border/50">
                    <div className="text-xs tracking-wider uppercase text-muted-foreground mb-1">{stat.label}</div>
                    <div className="text-sm font-medium">{stat.value}</div>
                </div>
            ))}
        </div>
    );
}
