"use client";

import { ScrollCarousel } from "@/components/common/scroll-carousel";
import { SectionDivider } from "@/components/section-divider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useTMDBEpisodeGroupDetails, useTMDBSeriesEpisodeGroups } from "@/hooks/use-tmdb";
import { useTraktShowEpisodes, useTraktShowSeasons } from "@/hooks/use-trakt";
import { type TMDBEpisodeGroupGroup } from "@/lib/tmdb";
import { type TraktMedia } from "@/lib/trakt";
import { cn } from "@/lib/utils";
import { getPosterUrl } from "@/lib/utils/media";
import { useRouter, useSearchParams } from "next/navigation";
import { memo, useCallback, useState } from "react";
import { EpisodeCard } from "./episode-card";
import { MediaHeader } from "./media-header";
import { PeopleSection } from "./people-section";
import { SeasonCard } from "./season-card";

interface ShowDetailsProps {
    media: TraktMedia;
    mediaId: string;
}

const GroupCard = memo(function GroupCard({
    group,
    groupIndex,
    isSelected,
    onClick,
    media,
}: {
    group: TMDBEpisodeGroupGroup;
    groupIndex: number;
    isSelected?: boolean;
    onClick?: () => void;
    media: TraktMedia;
}) {
    const groupLabel = `Part ${groupIndex + 1}`;
    const posterUrl =
        getPosterUrl(media.images) ||
        `https://placehold.co/200x300/1a1a1a/3e3e3e?text=${encodeURIComponent(groupLabel)}`;

    return (
        <div className={cn("group cursor-pointer w-28 sm:w-32 md:w-36 pt-1")} onClick={onClick}>
            <div
                className={cn(
                    "aspect-2/3 relative overflow-hidden bg-muted/30 rounded-sm transition-all duration-300",
                    isSelected
                        ? "ring-2 ring-primary ring-offset-1 ring-offset-background"
                        : "hover:ring-1 hover:ring-border"
                )}>
                {/* Poster background */}
                <img
                    src={posterUrl}
                    alt={group.name}
                    className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-hover"
                    loading="lazy"
                />

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                {/* Bottom info */}
                <div className="absolute bottom-0 left-0 right-0 p-3">
                    <div className="space-y-1">
                        <p className="text-xs text-white/90 font-medium line-clamp-2">{group.name}</p>
                        <p className="text-xs text-white/60">{group.episodes.length} Episodes</p>
                    </div>
                </div>
            </div>
        </div>
    );
});

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
                              episode={{ ...episode, season: selectedSeason }}
                              imdbId={media.ids?.imdb}
                              showMedia={media}
                          />
                      ))}
            </div>
        </div>
    );
});

const EpisodeGroupSection = memo(function EpisodeGroupSection({
    groupDetails,
    media,
    selectedGroupIndex,
}: {
    groupDetails: NonNullable<ReturnType<typeof useTMDBEpisodeGroupDetails>["data"]>;
    media: TraktMedia;
    selectedGroupIndex: number;
}): React.ReactElement {
    const selectedGroup = groupDetails.groups[selectedGroupIndex];

    if (!selectedGroup) return <div>No group selected</div>;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-light text-muted-foreground">{selectedGroup.name}</h3>
                <span className="text-xs tracking-wider uppercase text-muted-foreground">
                    {selectedGroup.episodes.length} Episodes
                </span>
            </div>
            <div className="flex flex-col gap-3">
                {selectedGroup.episodes.map((episode, index) => (
                    <EpisodeCard
                        key={episode.id}
                        episode={{
                            season: selectedGroup.order,
                            number: index + 1,
                            title: episode.name,
                            ids: {
                                trakt: episode.id,
                                slug: "",
                                tmdb: episode.id,
                            },
                            images: episode.still_path
                                ? {
                                      screenshot: [`image.tmdb.org/t/p/w500${episode.still_path}`],
                                      fanart: [],
                                      poster: [],
                                      logo: [],
                                      clearart: [],
                                      banner: [],
                                      thumb: [],
                                      headshot: [],
                                  }
                                : undefined,
                            overview: episode.overview,
                            first_aired: episode.air_date,
                            runtime: episode.runtime || undefined,
                            rating: episode.vote_average,
                        }}
                        imdbId={media.ids?.imdb}
                        showMedia={media}
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
    const groupParam = searchParams.get("group");
    const partParam = searchParams.get("part");
    const [selectedSeason, setSelectedSeason] = useState<number>(seasonParam ? parseInt(seasonParam, 10) : 1);
    const [selectedGroup, setSelectedGroup] = useState<string>(groupParam || "default");
    const [selectedGroupIndex, setSelectedGroupIndex] = useState<number>(partParam ? parseInt(partParam, 10) : 0);
    const { data: seasons, isLoading: seasonsLoading } = useTraktShowSeasons(mediaId);

    const tmdbId = media.ids?.tmdb;
    const { data: episodeGroups } = useTMDBSeriesEpisodeGroups(tmdbId!);
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

    const episodeCount = seasons?.find((s) => s.number === selectedSeason)?.episode_count;

    return (
        <div className="space-y-12">
            <MediaHeader media={media} mediaId={mediaId} type="show" />

            <section id="seasons" className="space-y-6 scroll-mt-16">
                <div className="flex items-center justify-between gap-4">
                    <SectionDivider label="Seasons & Episodes" />
                    {episodeGroups?.results && episodeGroups.results.length > 0 && (
                        <Select value={selectedGroup} onValueChange={handleGroupChange}>
                            <SelectTrigger size="sm">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="default">Default (Trakt)</SelectItem>
                                {episodeGroups.results.map((group) => (
                                    <SelectItem key={group.id} value={group.id}>
                                        {group.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                </div>

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
                ) : (
                    groupDetails && (
                        <>
                            {groupDetails.groups.filter((g) => g.order !== 0).length > 1 && (
                                <ScrollCarousel className="-mx-4 lg:mx-0">
                                    <div className="flex w-max gap-3 pb-4 px-4 lg:pl-2 lg:pr-0">
                                        {groupDetails.groups
                                            .filter((group) => group.order !== 0)
                                            .map((group, index) => (
                                                <GroupCard
                                                    key={group.id}
                                                    group={group}
                                                    groupIndex={index}
                                                    isSelected={selectedGroupIndex === index}
                                                    onClick={() => handleGroupIndexChange(index)}
                                                    media={media}
                                                />
                                            ))}
                                    </div>
                                </ScrollCarousel>
                            )}

                            <EpisodeGroupSection
                                groupDetails={{
                                    ...groupDetails,
                                    groups: groupDetails.groups.filter((g) => g.order !== 0),
                                }}
                                media={media}
                                selectedGroupIndex={selectedGroupIndex}
                            />
                        </>
                    )
                )}
            </section>

            <section className="space-y-6">
                <SectionDivider label="Cast & Crew" />
                <PeopleSection mediaId={mediaId} type="shows" />
            </section>
        </div>
    );
});
