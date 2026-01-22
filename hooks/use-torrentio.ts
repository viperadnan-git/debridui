import { useQuery } from "@tanstack/react-query";
import { TorrentioClient, type TorrentioSource, type TvSearchParams } from "@/lib/torrentio";
import { useSettingsStore } from "@/lib/stores/settings";

export function useTorrentioSources(
    imdbId: string | undefined,
    mediaType: "movie" | "show",
    tvParams?: TvSearchParams
) {
    const urlPrefix = useSettingsStore((state) => state.get("torrentioUrlPrefix"));

    return useQuery<TorrentioSource[], Error>({
        queryKey: ["torrentio", "sources", imdbId, mediaType, tvParams, urlPrefix],
        queryFn: async () => {
            if (!imdbId) {
                throw new Error("IMDB ID is required");
            }

            const torrentio = new TorrentioClient({ urlPrefix });

            if (mediaType === "show") {
                return torrentio.searchTvShow(imdbId, tvParams);
            }

            return torrentio.searchMovie(imdbId);
        },
        enabled: !!imdbId,
        staleTime: 60 * 60 * 1000, // 1 hour
        gcTime: 24 * 60 * 60 * 1000, // 24 hours
        retry: 2,
    });
}
