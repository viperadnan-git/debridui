import { useQuery } from "@tanstack/react-query";
import torrentio, { type TorrentioSource, type TvSearchParams } from "@/lib/torrentio";

export function useTorrentioSources(
    imdbId: string | undefined,
    mediaType: "movie" | "show",
    tvParams?: TvSearchParams
) {
    return useQuery<TorrentioSource[], Error>({
        queryKey: ["torrentio", "sources", imdbId, mediaType, tvParams],
        queryFn: async () => {
            if (!imdbId) {
                throw new Error("IMDB ID is required");
            }
            
            if (mediaType === "show") {
                return torrentio.searchTvShow(imdbId, tvParams);
            }
            
            return torrentio.searchMovie(imdbId);
        },
        enabled: !!imdbId,
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
        retry: 2,
    });
}