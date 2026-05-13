"use client";

import type { TraktMedia } from "@/lib/trakt";

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
        <>
            {/* Mobile + tablet: inline compact strip */}
            <dl className="lg:hidden flex flex-wrap items-baseline gap-x-4 gap-y-1.5 text-xs sm:gap-x-5 sm:text-sm">
                {stats.map((stat) => (
                    <div key={stat.label} className="inline-flex items-baseline gap-1.5 sm:gap-2">
                        <dt className="text-[10px] sm:text-[11px] tracking-[0.2em] uppercase text-muted-foreground/60">
                            {stat.label}
                        </dt>
                        <dd className="text-foreground/90">{stat.value}</dd>
                    </div>
                ))}
            </dl>

            {/* Desktop: original editorial column layout */}
            <dl className="hidden lg:flex flex-wrap gap-6 pt-2">
                {stats.map((stat) => (
                    <div key={stat.label} className="pl-3 border-l border-border/50">
                        <dt className="text-xs tracking-wider uppercase text-muted-foreground mb-1">{stat.label}</dt>
                        <dd className="text-sm font-medium">{stat.value}</dd>
                    </div>
                ))}
            </dl>
        </>
    );
}
