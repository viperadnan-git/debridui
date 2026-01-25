"use client";

import { type TraktMedia } from "@/lib/trakt";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollCarousel } from "@/components/common/scroll-carousel";
import { useTraktShowSeasons, useTraktShowEpisodes } from "@/hooks/use-trakt";
import { SeasonCard } from "./season-card";
import { EpisodeCard } from "./episode-card";
import { PeopleSection } from "./people-section";
import { MediaHeader } from "./media-header";
import { useState, memo, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";

interface ShowDetailsProps {
    media: TraktMedia;
    mediaId: string;
}

const SeasonsSection = memo(function SeasonsSection({
    selectedSeason,
    setSelectedSeason,
    mediaId,
}: {
    selectedSeason: number;
    setSelectedSeason: (season: number) => void;
    mediaId: string;
}): React.ReactElement | null {
    const { data: seasons, isLoading } = useTraktShowSeasons(mediaId);

    if (!isLoading && (!seasons || seasons.length === 0)) return null;

    return (
        <div>
            <h3 className="text-base sm:text-lg font-semibold mb-3">Seasons</h3>
            <ScrollCarousel className="w-full whitespace-nowrap">
                <div className="flex w-max space-x-4 pb-4">
                    {isLoading
                        ? Array.from({ length: 6 }).map((_, i) => (
                              <Skeleton key={i} className="w-32 sm:w-36 md:w-40 aspect-2/3 rounded-lg shrink-0" />
                          ))
                        : seasons?.map((season) => (
                              <SeasonCard
                                  key={season.number}
                                  season={season}
                                  isSelected={selectedSeason === season.number}
                                  onClick={() => setSelectedSeason(season.number)}
                                  mediaId={mediaId}
                              />
                          ))}
                </div>
            </ScrollCarousel>
        </div>
    );
});

const EpisodesSection = memo(function EpisodesSection({
    selectedSeason,
    mediaId,
    media,
}: {
    selectedSeason: number;
    mediaId: string;
    media: TraktMedia;
}): React.ReactElement | null {
    const { data: episodes, isLoading } = useTraktShowEpisodes(mediaId, selectedSeason);

    if (!isLoading && (!episodes || episodes.length === 0)) return null;

    return (
        <div>
            <h3 className="text-base sm:text-lg font-semibold mb-4" id="sources">
                {selectedSeason === 0 ? "Specials" : `Season ${selectedSeason}`} Episodes
            </h3>
            <div className="flex flex-col gap-3 sm:gap-4">
                {isLoading
                    ? Array.from({ length: 3 }).map((_, i) => (
                          <div key={i} className="bg-card rounded-lg border overflow-hidden">
                              <div className="flex flex-col sm:flex-row sm:gap-4">
                                  <Skeleton className="w-full sm:w-56 md:w-64 aspect-video" />
                                  <div className="flex-1 p-3 sm:py-3 sm:pr-4 sm:pl-0 space-y-3">
                                      <Skeleton className="h-6 w-3/4" />
                                      <Skeleton className="h-4 w-full" />
                                      <Skeleton className="h-4 w-full" />
                                      <div className="flex gap-4">
                                          <Skeleton className="h-4 w-24" />
                                          <Skeleton className="h-4 w-16" />
                                      </div>
                                  </div>
                              </div>
                          </div>
                      ))
                    : episodes?.map((episode) => (
                          <EpisodeCard
                              key={`${selectedSeason}-${episode.number}`}
                              episode={episode}
                              imdbId={media.ids?.imdb}
                              showTitle={media.title}
                          />
                      ))}
            </div>
        </div>
    );
});

export const ShowDetails = memo(function ShowDetails({ media, mediaId }: ShowDetailsProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const seasonParam = searchParams.get("season");
    const [selectedSeason, setSelectedSeason] = useState<number>(seasonParam ? parseInt(seasonParam, 10) : 1);

    const handleSeasonChange = useCallback(
        (season: number) => {
            setSelectedSeason(season);
            const params = new URLSearchParams(searchParams.toString());
            params.set("season", season.toString());
            router.replace(`?${params.toString()}`, { scroll: false });
        },
        [searchParams, router]
    );

    return (
        <div className="flex flex-col gap-8">
            <MediaHeader media={media} mediaId={mediaId} type="show" />

            <div className="space-y-4">
                <h2 className="text-lg sm:text-xl font-bold">Seasons & Episodes</h2>

                <SeasonsSection
                    selectedSeason={selectedSeason}
                    setSelectedSeason={handleSeasonChange}
                    mediaId={mediaId}
                />

                <EpisodesSection selectedSeason={selectedSeason} mediaId={mediaId} media={media} />
            </div>

            <PeopleSection mediaId={mediaId} type="shows" />
        </div>
    );
});
