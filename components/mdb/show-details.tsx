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
        <ScrollCarousel className="-mx-4 lg:mx-0">
            <div className="flex w-max gap-3 pb-4 max-lg:px-4">
                {isLoading
                    ? Array.from({ length: 6 }).map((_, i) => (
                          <Skeleton key={i} className="w-28 sm:w-32 md:w-36 aspect-2/3 rounded-sm shrink-0" />
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

    const seasonLabel = selectedSeason === 0 ? "Specials" : `Season ${selectedSeason}`;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-light text-muted-foreground" id="sources">
                    {seasonLabel}
                </h3>
                {episodes && (
                    <span className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground">
                        {episodes.length} Episodes
                    </span>
                )}
            </div>
            <div className="flex flex-col gap-3">
                {isLoading
                    ? Array.from({ length: 3 }).map((_, i) => (
                          <div key={i} className="rounded-sm border border-border/50 overflow-hidden">
                              <div className="flex flex-col sm:flex-row">
                                  <Skeleton className="w-full sm:w-48 md:w-56 aspect-video rounded-none" />
                                  <div className="flex-1 p-4 space-y-3">
                                      <Skeleton className="h-4 w-3/4" />
                                      <Skeleton className="h-3 w-1/2" />
                                      <Skeleton className="h-3 w-full" />
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
        <div className="space-y-12">
            <MediaHeader media={media} mediaId={mediaId} type="show" />

            <section className="space-y-6">
                <div className="flex items-center gap-4">
                    <div className="h-px flex-1 bg-border/50" />
                    <span className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground">
                        Seasons & Episodes
                    </span>
                    <div className="h-px flex-1 bg-border/50" />
                </div>

                <SeasonsSection
                    selectedSeason={selectedSeason}
                    setSelectedSeason={handleSeasonChange}
                    mediaId={mediaId}
                />

                <EpisodesSection selectedSeason={selectedSeason} mediaId={mediaId} media={media} />
            </section>

            <section className="space-y-6">
                <div className="flex items-center gap-4">
                    <div className="h-px flex-1 bg-border/50" />
                    <span className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground">Cast & Crew</span>
                    <div className="h-px flex-1 bg-border/50" />
                </div>
                <PeopleSection mediaId={mediaId} type="shows" />
            </section>
        </div>
    );
});
