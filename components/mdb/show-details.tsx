"use client";

import { type TraktMedia, type TraktSeason } from "@/lib/trakt";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollCarousel } from "@/components/common/scroll-carousel";
import { useTraktShowSeasons, useTraktShowEpisodes, useTraktPeople } from "@/hooks/use-trakt";
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
    seasonsData,
    selectedSeason,
    setSelectedSeason,
    mediaId,
}: {
    seasonsData: unknown;
    selectedSeason: number;
    setSelectedSeason: (season: number) => void;
    mediaId: string;
}): React.ReactElement | null {
    const seasons = seasonsData as Array<{ number: number; [key: string]: unknown }>;
    if (!seasons || seasons.length === 0) return null;

    return (
        <div>
            <h3 className="text-base sm:text-lg font-semibold mb-3">Seasons</h3>
            <ScrollCarousel className="w-full whitespace-nowrap">
                <div className="flex w-max space-x-4 pb-4">
                    {seasons.map((season) => (
                        <SeasonCard
                            key={season.number}
                            season={season as unknown as TraktSeason}
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

    const seasonsQuery = useTraktShowSeasons(mediaId);
    const episodesQuery = useTraktShowEpisodes(mediaId, selectedSeason);
    const peopleQuery = useTraktPeople(mediaId, "shows");

    return (
        <div className="flex flex-col gap-8">
            <MediaHeader media={media} mediaId={mediaId} type="show" />

            <div className="space-y-4">
                <h2 className="text-lg sm:text-xl font-bold">Seasons & Episodes</h2>

                <SeasonsSection
                    seasonsData={seasonsQuery.data}
                    selectedSeason={selectedSeason}
                    setSelectedSeason={handleSeasonChange}
                    mediaId={mediaId}
                />

                {episodesQuery.data && episodesQuery.data.length > 0 && (
                    <div>
                        <h3 className="text-base sm:text-lg font-semibold mb-4" id="sources">
                            {selectedSeason === 0 ? "Specials" : `Season ${selectedSeason}`} Episodes
                        </h3>
                        <div className="flex flex-col gap-3 sm:gap-4">
                            {episodesQuery.data.map((episode) => (
                                <EpisodeCard
                                    key={`${selectedSeason}-${episode.number}`}
                                    episode={episode}
                                    imdbId={media.ids?.imdb}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {seasonsQuery.isLoading && (
                    <div className="space-y-3">
                        <h3 className="text-base sm:text-lg font-semibold">Seasons</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <Skeleton key={i} className="aspect-2/3 rounded-lg" />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <PeopleSection people={peopleQuery.data} isLoading={peopleQuery.isLoading} error={peopleQuery.error} />
        </div>
    );
});
