'use client'

import { type TraktMedia } from '@/lib/trakt'
import Link from 'next/link'
import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import { memo } from 'react'

interface MediaCardProps {
  media: TraktMedia
  type: 'movie' | 'show'
  rank?: number
  watchers?: number
  className?: string
}

export const MediaCard = memo(function MediaCard({ media, type, rank, className }: MediaCardProps) {
  const linkHref = media.ids?.imdb 
    ? `/${type}/${media.ids.imdb}`
    : '#'

  const posterUrl = media.images?.poster?.[0] 
    ? `https://${media.images.poster[0]}`
    : `https://placehold.co/300x450/1a1a1a/white?text=${encodeURIComponent(media.title)}`

  return (
    <Link href={linkHref} className="block">
      <div className={cn(
        "group relative overflow-hidden transition-all hover:scale-105",
        className
      )}>
        <div className="aspect-[2/3] relative overflow-hidden bg-muted rounded-md">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={posterUrl}
            alt={media.title}
            className="object-cover w-full h-full"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          
          <div className="absolute bottom-0 left-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <h3 className="font-semibold line-clamp-2 text-xs text-white mb-1">
              {media.title}
            </h3>
            
            <div className="flex items-center gap-2 text-[10px] text-white/80">
              {media.year && (
                <span>{media.year}</span>
              )}
              
              {media.rating && (
                <div className="flex items-center gap-0.5">
                  <Star className="h-2.5 w-2.5 fill-yellow-500 text-yellow-500" />
                  {media.rating.toFixed(1)}
                </div>
              )}

              {rank && (
                <span>#{rank}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
});