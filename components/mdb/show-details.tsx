"use client";

import { ScrollCarousel } from "@/components/common/scroll-carousel";
import { SectionDivider } from "@/components/section-divider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useTMDBEpisodeGroupDetails, useTMDBSeriesEpisodeGroups } from "@/hooks/use-tmdb";
import { useTraktShowEpisodes, useTraktShowSeasons } from "@/hooks/use-trakt";
import { type TMDBEpisodeGroupEpisode } from "@/lib/tmdb";
import { type TraktEpisode, type TraktImages, type TraktMedia, type TraktSeason } from "@/lib/trakt";
import { useRouter, useSearchParams } from "next/navigation";
import { memo, useCallback, useMemo, useState } from "react";
import { EpisodeCard } from "./episode-card";
import { MediaHeader } from "./media-header";
import { PeopleSection } from "./people-section";
import { SeasonCard } from "./season-card";

interface ShowDetailsProps {
    media: TraktMedia;
    mediaId: string;
}

function EpisodeList({
    label,
    episodes,
    imdbId,
    showMedia,
}: {
    label: string;
    episodes: TraktEpisode[];
    imdbId?: string;
    showMedia: TraktMedia;
}) {
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-light text-muted-foreground">{label}</h3>
                <span className="text-xs tracking-wider uppercase text-muted-foreground">
                    {episodes.length} Episodes
                </span>
            </div>
            <div className="flex flex-col gap-3">
                {episodes.map((episode) => (
                    <EpisodeCard key={episode.number} episode={episode} imdbId={imdbId} showMedia={showMedia} />
                ))}
            </div>
        </div>
    );
}

function tmdbEpisodeToTrakt(episode: TMDBEpisodeGroupEpisode, seasonOrder: number, index: number): TraktEpisode {
    return {
        season: seasonOrder,
        number: index + 1,
        title: episode.name,
        ids: { trakt: 0, slug: "", tmdb: episode.id },
        // Only screenshot is used by EpisodeCard
        images: episode.still_path
            ? ({ screenshot: [`image.tmdb.org/t/p/w500${episode.still_path}`] } as TraktImages)
            : undefined,
        overview: episode.overview,
        first_aired: episode.air_date,
        runtime: episode.runtime || undefined,
        rating: episode.vote_average,
    };
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

    if (isLoading) {
        return (
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-light text-muted-foreground">{seasonLabel}</h3>
                </div>
                <div className="flex flex-col gap-3">
                    {Array.from({ length: skeletonCount }).map((_, i) => (
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
                    ))}
                </div>
            </div>
        );
    }

    return (
        <EpisodeList
            label={seasonLabel}
            episodes={episodes!.map((ep) => ({ ...ep, season: selectedSeason }))}
            imdbId={media.ids?.imdb}
            showMedia={media}
        />
    );
});

export const ShowDetails = memo(function ShowDetails({ media, mediaId }: ShowDetailsProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const seasonParam = searchParams.get("season");
    const groupParam = searchParams.get("group");
    const partParam = searchParams.get("part");
    const [selectedSeason, setSelectedSeason] = useState<number>(seasonParam ? parseInt(seasonParam, 10) : 1);
    const [selectedGroup, setSelectedGroup] = useState<string>(groupParam || "default");
    const [selectedGroupIndex, setSelectedGroupIndex] = useState<number>(partParam ? parseInt(partParam, 10) : 0);
    const { data: seasons, isLoading: seasonsLoading } = useTraktShowSeasons(mediaId);

    const { data: episodeGroups } = useTMDBSeriesEpisodeGroups(media.ids?.tmdb ?? 0);
    const { data: groupDetails } = useTMDBEpisodeGroupDetails(selectedGroup !== "default" ? selectedGroup : "");

    const handleSeasonChange = useCallback(
        (season: number) => {
            setSelectedSeason(season);
            const params = new URLSearchParams(searchParams.toString());
            params.set("season", season.toString());
            router.replace(`?${params.toString()}`, { scroll: false });
        },
        [searchParams, router]
    );

    const handleGroupChange = useCallback(
        (group: string) => {
            setSelectedGroup(group);
            setSelectedGroupIndex(0);
            const params = new URLSearchParams(searchParams.toString());
            if (group === "default") {
                params.delete("group");
                params.delete("part");
            } else {
                params.set("group", group);
                params.delete("part");
            }
            router.replace(`?${params.toString()}`, { scroll: false });
        },
        [searchParams, router]
    );

    const handleGroupIndexChange = useCallback(
        (index: number) => {
            setSelectedGroupIndex(index);
            const params = new URLSearchParams(searchParams.toString());
            if (index === 0) {
                params.delete("part");
            } else {
                params.set("part", index.toString());
            }
            router.replace(`?${params.toString()}`, { scroll: false });
        },
        [searchParams, router]
    );

    // Filter out "specials" group (order 0), map to TraktSeason for SeasonCard reuse
    const filteredGroups = useMemo(() => {
        const groups = groupDetails?.groups.filter((g) => g.order !== 0);
        return groups?.map(
            (g): TraktSeason => ({
                number: g.order,
                ids: { trakt: 0, slug: "", tmdb: 0 },
                images: media.images,
                title: g.name,
                episode_count: g.episodes.length,
            })
        );
    }, [groupDetails, media.images]);

    // Pre-map TMDB episodes to TraktEpisode format for the selected group
    const groupEpisodes = useMemo(() => {
        const group = groupDetails?.groups.filter((g) => g.order !== 0)[selectedGroupIndex];
        return group?.episodes.map((ep, i) => tmdbEpisodeToTrakt(ep, group.order, i));
    }, [groupDetails, selectedGroupIndex]);

    const episodeCount = seasons?.find((s) => s.number === selectedSeason)?.episode_count;

    return (
        <div className="space-y-12">
            <MediaHeader media={media} mediaId={mediaId} type="show" />

            <section id="seasons" className="space-y-6 scroll-mt-16">
                <SectionDivider label="Seasons & Episodes" />

                {selectedGroup === "default" ? (
                    <>
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
                    </>
                ) : !groupDetails ? (
                    <div className="space-y-4">
                        <ScrollCarousel className="-mx-4 lg:mx-0">
                            <div className="flex w-max gap-3 pb-4 px-4 lg:pl-2 lg:pr-0">
                                {Array.from({ length: 4 }).map((_, i) => (
                                    <Skeleton key={i} className="w-28 sm:w-32 md:w-36 aspect-2/3 rounded-sm shrink-0" />
                                ))}
                            </div>
                        </ScrollCarousel>
                        {Array.from({ length: 3 }).map((_, i) => (
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
                        ))}
                    </div>
                ) : (
                    filteredGroups && (
                        <>
                            {filteredGroups.length > 1 && (
                                <ScrollCarousel className="-mx-4 lg:mx-0">
                                    <div className="flex w-max gap-3 pb-4 px-4 lg:pl-2 lg:pr-0">
                                        {filteredGroups.map((season, index) => (
                                            <SeasonCard
                                                key={season.number}
                                                season={season}
                                                isSelected={selectedGroupIndex === index}
                                                onClick={() => handleGroupIndexChange(index)}
                                            />
                                        ))}
                                    </div>
                                </ScrollCarousel>
                            )}

                            {groupEpisodes && (
                                <EpisodeList
                                    label={filteredGroups[selectedGroupIndex]?.title ?? "Episodes"}
                                    episodes={groupEpisodes}
                                    imdbId={media.ids?.imdb}
                                    showMedia={media}
                                />
                            )}
                        </>
                    )
                )}
                {/* Episode grouping selector */}
                <div className="flex items-center justify-end gap-3">
                    <span className="hidden sm:inline text-xs tracking-widest uppercase text-muted-foreground">
                        Grouping
                    </span>
                    <Select value={selectedGroup} onValueChange={handleGroupChange}>
                        <SelectTrigger size="sm" className="w-28 sm:w-40 text-xs sm:text-sm">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="default">Default</SelectItem>
                            {episodeGroups?.results?.map((group) => (
                                <SelectItem key={group.id} value={group.id}>
                                    {group.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </section>

            <section className="space-y-6">
                <SectionDivider label="Cast & Crew" />
                <PeopleSection mediaId={mediaId} type="shows" />
            </section>
        </div>
    );
});
