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
    const formatLanguage = (lang?: string) => {
        if (!lang) return null;
        return lang.toUpperCase();
    };

    const formatCountry = (country?: string) => {
        if (!country) return null;
        return country.toUpperCase();
    };

    const stats = [
        // Status
        media.status && {
            label: "Rating",
            value: media.rating ? `${media.rating.toFixed(1)}` : "N/A",
        },

        // Language
        media.language && {
            label: "Language",
            value: formatLanguage(media.language),
        },

        // Country
        media.country && {
            label: "Country",
            value: formatCountry(media.country),
        },

        // Episodes (for shows)
        type === "show" &&
            media.aired_episodes && {
                label: "Episodes",
                value: media.aired_episodes.toString(),
            },
    ].filter(Boolean) as Stat[];

    if (stats.length === 0) return null;

    return (
        <div className="space-y-4">
            <h3 className="text-base sm:text-lg font-semibold">Details</h3>
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                {stats.map((s, i) => (
                    <div
                        key={i}
                        role="listitem"
                        className="flex flex-col items-center justify-center px-3 text-center">
                        <div
                            className={[
                                "text-foreground font-semibold tracking-tight whitespace-nowrap",
                                // Fluid font size
                                "text-[clamp(1.75rem,5vw,2.5rem)] leading-none uppercase",
                            ].join(" ")}>
                            {s.value}
                        </div>
                        <p className="text-muted-foreground mt-2 text-sm sm:text-base capitalize">
                            {s.label}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}
