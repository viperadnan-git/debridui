"use client";

import { type TraktMedia } from "@/lib/trakt";
import Link from "next/link";
import Image from "next/image";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { memo } from "react";
import { getPosterUrl } from "@/lib/utils/trakt";

interface MediaCardProps {
    media: TraktMedia;
    type: "movie" | "show";
    rank?: number;
    watchers?: number;
    className?: string;
}

export const MediaCard = memo(function MediaCard({ media, type, rank, className }: MediaCardProps) {
    const slug = media.ids?.slug || media.ids?.imdb;
    const linkHref = slug ? `/${type}/${slug}` : "#";
    const posterUrl =
        getPosterUrl(media.images) ||
        `https://placehold.co/300x450/1a1a1a/white?text=${encodeURIComponent(media.title)}`;

    return (
        <Link href={linkHref} className="block [content-visibility:auto] [contain-intrinsic-size:0_300px]">
            <div className={cn("group relative overflow-hidden transition-all hover:scale-105", className)}>
                <div className="aspect-2/3 relative overflow-hidden bg-muted rounded-md">
                    <Image
                        src={posterUrl}
                        alt={media.title}
                        fill
                        sizes="(max-width: 640px) 120px, (max-width: 768px) 150px, 180px"
                        className="object-cover"
                        loading="lazy"
                        unoptimized
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                    <div className="absolute bottom-0 left-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <h3 className="font-semibold line-clamp-2 text-xs text-white mb-1">{media.title}</h3>

                        <div className="flex items-center gap-2 text-[10px] text-white/80">
                            {media.year && <span>{media.year}</span>}

                            {media.rating && (
                                <div className="flex items-center gap-0.5">
                                    <Star className="h-2.5 w-2.5 fill-yellow-500 text-yellow-500" />
                                    {media.rating.toFixed(1)}
                                </div>
                            )}

                            {rank && <span>#{rank}</span>}
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
});
