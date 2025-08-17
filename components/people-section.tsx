'use client'

import { type TraktCastAndCrew, type TraktCastMember, type TraktCrewMember } from '@/lib/trakt'
import { Skeleton } from '@/components/ui/skeleton'
import { User } from 'lucide-react'

interface PeopleSectionProps {
  people?: TraktCastAndCrew
  isLoading?: boolean
  error?: Error | null
}

export function PeopleSection({ people, isLoading, error }: PeopleSectionProps) {
  if (error) {
    return null
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg sm:text-xl font-bold">Cast</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="text-center space-y-3">
              <Skeleton className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 xl:w-32 xl:h-32 rounded-full mx-auto" />
              <div className="space-y-1">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-3/4 mx-auto" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!people || (!people.cast?.length && !people.crew)) {
    return null
  }

  return (
    <div className="space-y-4">
      {people.cast && people.cast.length > 0 && (
        <div>
          <h3 className="text-base sm:text-lg font-semibold mb-3">Cast</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
            {people.cast.slice(0, 18).map((member, index) => (
              <PersonCard key={index} person={member} type="cast" />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

interface PersonCardProps {
  person: TraktCastMember | TraktCrewMember
  type: 'cast' | 'crew'
}

function PersonCard({ person, type }: PersonCardProps) {
  const imageUrl = person.person.images?.headshot?.[0]
    ? `https:${person.person.images.headshot[0]}`
    : null

  const role = type === 'cast' 
    ? (person as TraktCastMember).characters?.join(', ')
    : (person as TraktCrewMember).jobs?.join(', ') || (person as TraktCrewMember).job?.join(', ')

  return (
    <div className="group cursor-pointer text-center">
      <div className="space-y-3">
        {/* Profile Image */}
        <div className="relative mx-auto flex items-center justify-center">
          <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 xl:w-32 xl:h-32 relative overflow-hidden bg-muted rounded-full shadow-md group-hover:shadow-lg transition-all">
            {imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageUrl}
                alt={person.person.name}
                className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-300"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                <User className="h-6 w-6 sm:h-8 sm:w-8 md:h-10 md:w-10 lg:h-12 lg:w-12 xl:h-14 xl:w-14 text-muted-foreground" />
              </div>
            )}
            
            {/* Ring on hover */}
            <div className="absolute inset-0 rounded-full ring-2 ring-primary/0 group-hover:ring-primary/50 transition-all" />
          </div>
        </div>
        
        {/* Person Info */}
        <div className="space-y-1 min-h-[3rem] sm:min-h-[3.5rem] flex flex-col justify-start">
          <h4 className="font-semibold text-xs sm:text-sm md:text-base lg:text-lg line-clamp-2 group-hover:text-primary transition-colors leading-tight">
            {person.person.name}
          </h4>
          
          {role && (
            <p className="text-[10px] sm:text-xs md:text-sm text-muted-foreground line-clamp-2 leading-relaxed">
              {role}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}