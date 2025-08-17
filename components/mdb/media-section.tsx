'use client'

import { MediaCard } from '@/components/mdb/media-card'
import { type TraktMediaItem } from '@/lib/trakt'
import { Skeleton } from '@/components/ui/skeleton'
import { ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { memo } from 'react'

interface MediaSectionProps {
  title: string
  items?: TraktMediaItem[]
  isLoading?: boolean
  error?: Error | null
  showRank?: boolean
  viewAllHref?: string
}

export const MediaSection = memo(function MediaSection({ 
  title, 
  items, 
  isLoading, 
  error,
  showRank = false,
  viewAllHref 
}: MediaSectionProps) {
  if (error) {
    return (
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">{title}</h2>
        <div className="text-muted-foreground">Failed to load {title.toLowerCase()}</div>
      </section>
    )
  }

  return (
    <section className="space-y-2 sm:space-y-3 lg:space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg sm:text-xl lg:text-2xl font-bold">{title}</h2>
        {viewAllHref && (
          <Link 
            href={viewAllHref}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            View All
            <ChevronRight className="h-4 w-4" />
          </Link>
        )}
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 lg:gap-4">
        {isLoading ? (
          Array.from({ length: 10 }).map((_, i) => (
            <div key={i}>
              <Skeleton className="aspect-[2/3] rounded-md" />
            </div>
          ))
        ) : (
          items?.slice(0, 20).map((item, index) => {
            const media = item.movie || item.show
            const type = item.movie ? 'movie' : 'show'
            
            if (!media) return null

            return (
              <MediaCard
                key={`${type}-${media.ids?.trakt || index}`}
                media={media}
                type={type}
                rank={showRank ? index + 1 : undefined}
                watchers={item.watchers}
              />
            )
          })
        )}
      </div>
    </section>
  )
});