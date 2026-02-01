"use client";

import { type TraktMedia } from "@/lib/trakt";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { memo } from "react";
import { getPosterUrl } from "@/lib/utils/trakt";
import { Star } from "lucide-react";

interface MediaCardProps {
    media: TraktMedia;
    type: "movie" | "show";
    rank?: number;
    watchers?: number;
    className?: string;
}

export const MediaCard = memo(function MediaCard({ media, type, rank, className }: MediaCardProps) {
    const slug = media.ids?.slug || media.ids?.imdb;
    const linkHref = slug ? `/${type}s/${slug}` : "#";
    const posterUrl =
        getPosterUrl(media.images) ||
        `https://placehold.co/300x450/1a1a1a/3e3e3e?text=${encodeURIComponent(media.title)}`;

    return (
        <Link href={linkHref} className="block group">
            <div
                className={cn(
                    "relative overflow-hidden transition-transform duration-300 ease-out hover:scale-hover [content-visibility:auto] [contain-intrinsic-size:120px_180px]",
                    className
                )}>
                <div className="aspect-2/3 relative overflow-hidden bg-muted/50 rounded-sm">
                    <Image
                        src={posterUrl}
                        alt={media.title}
                        fill
                        sizes="(max-width: 640px) 120px, (max-width: 768px) 150px, 180px"
                        className="object-cover transition-opacity duration-300"
                        loading="lazy"
                        unoptimized
                    />

                    {/* Rank badge - editorial style */}
                    {rank && (
                        <div className="absolute top-2 left-2 z-10">
                            <span className="text-xs font-medium tracking-wider text-white/90 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-sm">
                                {String(rank).padStart(2, "0")}
                            </span>
                        </div>
                    )}

                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                    {/* Content on hover */}
                    <div className="absolute inset-x-0 bottom-0 p-3 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                        <h3 className="font-medium text-sm text-white leading-tight line-clamp-2 mb-1.5">
                            {media.title}
                        </h3>

                        <div className="flex items-center gap-2 text-xs text-white/70">
                            {media.year && <span>{media.year}</span>}
                            {media.rating && (
                                <>
                                    <span className="text-white/30">·</span>
                                    <span className="flex items-center gap-1">
                                        <Star className="size-3.5 fill-[#F5C518] text-[#F5C518]" />
                                        {media.rating.toFixed(1)}
                                    </span>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
});
