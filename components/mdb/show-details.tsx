"use client";

import { type TraktMedia } from "@/lib/trakt";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollCarousel } from "@/components/common/scroll-carousel";
import { useTraktShowSeasons, useTraktShowEpisodes } from "@/hooks/use-trakt";
import { SeasonCard } from "./season-card";
import { EpisodeCard } from "./episode-card";
import { PeopleSection } from "./people-section";
import { MediaHeader } from "./media-header";
import { SectionDivider } from "@/components/section-divider";
import { useState, memo, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";

interface ShowDetailsProps {
    media: TraktMedia;
    mediaId: string;
}

const EpisodesSection = memo(function EpisodesSection({
    selectedSeason,
    episodeCount,
    mediaId,
    media,
}: {
    selectedSeason: number;
    episodeCount?: number;
    mediaId: string;
    media: TraktMedia;
}): React.ReactElement | null {
    const { data: episodes, isLoading } = useTraktShowEpisodes(mediaId, selectedSeason);

    if (!isLoading && (!episodes || episodes.length === 0)) return null;

    const seasonLabel = selectedSeason === 0 ? "Specials" : `Season ${selectedSeason}`;
    const skeletonCount = Math.min(episodeCount || 3, 20);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-light text-muted-foreground" id="sources">
                    {seasonLabel}
                </h3>
                {episodes && (
                    <span className="text-xs tracking-wider uppercase text-muted-foreground">
                        {episodes.length} Episodes
                    </span>
                )}
            </div>
            <div className="flex flex-col gap-3">
                {isLoading
                    ? Array.from({ length: skeletonCount }).map((_, i) => (
                          <div key={i} className="rounded-sm border border-border/50 overflow-hidden">
                              <div className="flex flex-row items-start">
                                  <Skeleton className="w-36 sm:w-56 md:w-60 shrink-0 aspect-[5/3] sm:aspect-video rounded-none" />
                                  <div className="flex-1 px-2.5 py-1.5 sm:p-3 md:p-4 space-y-1.5 sm:space-y-2">
                                      <Skeleton className="h-4 sm:h-5 w-3/4" />
                                      <Skeleton className="h-3 w-1/3" />
                                      <Skeleton className="h-3 w-full hidden sm:block" />
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
    const { data: seasons, isLoading: seasonsLoading } = useTraktShowSeasons(mediaId);

    const handleSeasonChange = useCallback(
        (season: number) => {
            setSelectedSeason(season);
            const params = new URLSearchParams(searchParams.toString());
            params.set("season", season.toString());
            router.replace(`?${params.toString()}`, { scroll: false });
        },
        [searchParams, router]
    );

    const episodeCount = seasons?.find((s) => s.number === selectedSeason)?.episode_count;

    return (
        <div className="space-y-12">
            <MediaHeader media={media} mediaId={mediaId} type="show" />

            <section id="seasons" className="space-y-6 scroll-mt-16">
                <SectionDivider label="Seasons & Episodes" />

                {(seasonsLoading || (seasons && seasons.length > 0)) && (
                    <ScrollCarousel className="-mx-4 lg:mx-0">
                        <div className="flex w-max gap-3 pb-4 px-4 lg:pl-2 lg:pr-0">
                            {seasonsLoading
                                ? Array.from({ length: 6 }).map((_, i) => (
                                      <Skeleton
                                          key={i}
                                          className="w-28 sm:w-32 md:w-36 aspect-2/3 rounded-sm shrink-0"
                                      />
                                  ))
                                : seasons?.map((season) => (
                                      <SeasonCard
                                          key={season.number}
                                          season={season}
                                          isSelected={selectedSeason === season.number}
                                          onClick={() => handleSeasonChange(season.number)}
                                          mediaId={mediaId}
                                      />
                                  ))}
                        </div>
                    </ScrollCarousel>
                )}

                <EpisodesSection
                    selectedSeason={selectedSeason}
                    episodeCount={episodeCount}
                    mediaId={mediaId}
                    media={media}
                />
            </section>

            <section className="space-y-6">
                <SectionDivider label="Cast & Crew" />
                <PeopleSection mediaId={mediaId} type="shows" />
            </section>
        </div>
    );
});
