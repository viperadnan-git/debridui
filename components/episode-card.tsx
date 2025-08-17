'use client'

import { type TraktEpisode } from '@/lib/trakt'
import { Badge } from '@/components/ui/badge'
import { Star, Calendar, Clock, Play } from 'lucide-react'
import { cn } from '@/lib/utils'
import { memo } from 'react'

interface EpisodeCardProps {
  episode: TraktEpisode
  className?: string
}

export const EpisodeCard = memo(function EpisodeCard({ episode, className }: EpisodeCardProps) {
  const screenshotUrl = episode.images?.screenshot?.[0]
    ? `https:${episode.images.screenshot[0]}`
    : `https://placehold.co/400x225/1a1a1a/white?text=Episode+${episode.number}`

  const formatDate = (dateString?: string) => {
    if (!dateString) return null
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    })
  }

  return (
    <div className={cn("group cursor-pointer", className)}>
      <div className="bg-card rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all hover:scale-[1.02]">
        {/* Episode thumbnail */}
        <div className="aspect-video relative overflow-hidden bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={screenshotUrl}
            alt={episode.title}
            className="object-cover w-full h-full transition-transform group-hover:scale-105"
            loading="lazy"
          />
          
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
          
          {/* Play button overlay */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="bg-black/50 rounded-full p-3">
              <Play className="h-6 w-6 text-white fill-white" />
            </div>
          </div>
          
          {/* Episode number badge */}
          <div className="absolute top-2 left-2">
            <Badge variant="secondary" className="text-xs font-bold shadow-sm">
              E{episode.number}
            </Badge>
          </div>

          {/* Rating badge */}
          {episode.rating && (
            <div className="absolute top-2 right-2">
              <Badge variant="outline" className="text-xs bg-black/50 border-white/20 text-white">
                <Star className="h-3 w-3 fill-yellow-500 text-yellow-500 mr-1" />
                {episode.rating.toFixed(1)}
              </Badge>
            </div>
          )}
        </div>
        
        {/* Episode details */}
        <div className="p-2 sm:p-3 lg:p-4 space-y-1.5 sm:space-y-2">
          <div className="space-y-1">
            <h4 className="font-semibold text-xs sm:text-sm lg:text-base line-clamp-1 group-hover:text-primary transition-colors leading-tight">
              {episode.title || `Episode ${episode.number}`}
            </h4>
            
            {episode.overview && (
              <p className="text-[10px] sm:text-xs lg:text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                {episode.overview}
              </p>
            )}
          </div>
          
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[10px] sm:text-xs text-muted-foreground">
            {episode.first_aired && (
              <div className="flex items-center gap-0.5 sm:gap-1">
                <Calendar className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                {formatDate(episode.first_aired)}
              </div>
            )}
            
            {episode.runtime && (
              <div className="flex items-center gap-0.5 sm:gap-1">
                <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                {episode.runtime}m
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
});