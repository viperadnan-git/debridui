"use client";

import { useState, useCallback } from "react";
import { useRouter } from "@bprogress/next/app";
import { CommandDialog, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { useTraktSearch } from "@/hooks/use-trakt";
import { Search, Film, Tv, Star, Calendar, HardDrive, Loader2 } from "lucide-react";
import { cn, formatSize } from "@/lib/utils";
import { type TraktSearchResult } from "@/lib/trakt";
import { type DebridFile } from "@/lib/types";
import { getFindTorrentsCacheKey } from "@/lib/utils/cache-keys";
import { useQuery } from "@tanstack/react-query";
import { useAuthContext } from "@/lib/contexts/auth";
import { FileItemContextMenu } from "../explorer/file-item-context-menu";

interface SearchDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
    const router = useRouter();
    const { client, currentUser } = useAuthContext();
    const [query, setQuery] = useState("");

    const { data: searchResults, isLoading: isTraktSearching } = useTraktSearch(
        query,
        undefined,
        open && query.trim().length > 2
    );
    const { data: fileResults, isLoading: isFileSearching } = useQuery<DebridFile[]>({
        queryKey: getFindTorrentsCacheKey(currentUser.id, query),
        queryFn: () => (client.findTorrents ? client.findTorrents(query) : Promise.resolve([])),
        enabled: open && query.trim().length > 2 && !!client.findTorrents,
        staleTime: 0,
        gcTime: 60_000,
    });

    const handleSelect = useCallback(
        (result: TraktSearchResult) => {
            const media = result.movie || result.show;
            const slug = media?.ids?.slug || media?.ids?.imdb;
            if (!slug) return;

            const type = result.movie ? "movie" : "show";
            router.push(`/${type}/${slug}`);
            onOpenChange(false);
            setQuery("");
        },
        [router, onOpenChange]
    );

    const handleFileSelect = useCallback(
        (file: DebridFile) => {
            const searchParams = new URLSearchParams();
            searchParams.set("q", `id:${file.id}`);
            router.push(`/files?${searchParams.toString()}`);
            onOpenChange(false);
            setQuery("");
        },
        [router, onOpenChange]
    );

    const renderFileItem = useCallback(
        (file: DebridFile) => {
            const sizeDisplay = formatSize(file.size);

            return (
                <CommandItem
                    key={`file-${file.id}`}
                    value={`file-${file.id}`}
                    keywords={[file.name, file.id.toString()]}
                    onSelect={() => handleFileSelect(file)}
                    className="flex items-center gap-2 sm:gap-3 px-1 sm:px-3 py-2 sm:py-3 cursor-pointer">
                    <FileItemContextMenu file={file}>
                        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                            <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-md bg-muted">
                                <HardDrive className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="font-medium truncate text-xs sm:text-sm mb-0.5">{file.name}</div>
                                <div className="flex items-center gap-1.5 sm:gap-2 text-xs text-muted-foreground">
                                    <span>{sizeDisplay}</span>
                                    {file.status && (
                                        <>
                                            <span>•</span>
                                            <span className="capitalize">{file.status}</span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </FileItemContextMenu>
                </CommandItem>
            );
        },
        [handleFileSelect]
    );

    const renderMediaItem = useCallback(
        (result: TraktSearchResult) => {
            const media = result.movie || result.show;
            if (!media) return null;

            const type = result.movie ? "movie" : "show";
            const icon = type === "movie" ? Film : Tv;
            const Icon = icon;

            const posterImage = media.images?.poster?.[0]
                ? `https://${media.images.poster[0]}`
                : media.images?.fanart?.[0]
                  ? `https://${media.images.fanart[0]}`
                  : media.images?.banner?.[0]
                    ? `https://${media.images.banner[0]}`
                    : null;

            return (
                <CommandItem
                    key={`${type}-${media.ids?.trakt}`}
                    value={`${type}-${media.ids?.trakt}-${media.title}`}
                    keywords={[media.title, type, media.year?.toString() || ""]}
                    onSelect={() => handleSelect(result)}
                    className="flex items-center gap-2 sm:gap-3 px-1 sm:px-3 py-2 sm:py-3 cursor-pointer">
                    {/* Poster thumbnail or icon */}
                    <div className="shrink-0 w-10 h-14 sm:w-12 sm:h-16 bg-muted rounded-md overflow-hidden">
                        {posterImage ? (
                            <img src={posterImage} alt={media.title} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                            </div>
                        )}
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5">
                            <span className="font-medium truncate text-xs sm:text-sm">{media.title}</span>
                            <Badge
                                variant="secondary"
                                className={cn(
                                    "text-xs px-1 sm:px-1.5 py-0 h-3.5 sm:h-4 shrink-0",
                                    type === "movie"
                                        ? "bg-blue-500/10 text-blue-600"
                                        : "bg-purple-500/10 text-purple-600"
                                )}>
                                {type === "movie" ? "Movie" : "Show"}
                            </Badge>
                        </div>

                        <div className="flex items-center gap-1.5 sm:gap-2 text-xs text-muted-foreground">
                            {media.year && (
                                <div className="flex items-center gap-0.5 sm:gap-1">
                                    <Calendar className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                                    <span>{media.year}</span>
                                </div>
                            )}
                            {media.rating && (
                                <>
                                    {media.year && <span>•</span>}
                                    <div className="flex items-center gap-0.5 sm:gap-1">
                                        <Star className="h-2.5 w-2.5 sm:h-3 sm:w-3 fill-yellow-400 text-yellow-400" />
                                        <span>{media.rating.toFixed(1)}</span>
                                    </div>
                                </>
                            )}
                        </div>

                        {media.overview && (
                            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mt-1">
                                {media.overview}
                            </p>
                        )}
                    </div>
                </CommandItem>
            );
        },
        [handleSelect]
    );

    const hasFileResults = fileResults && fileResults.length > 0;
    const hasTraktResults = searchResults && searchResults.length > 0;
    const isSearching = query.trim().length > 2;
    const bothLoaded = !isFileSearching && !isTraktSearching;
    const hasAnyResults = hasFileResults || hasTraktResults;

    return (
        <CommandDialog
            open={open}
            onOpenChange={onOpenChange}
            shouldFilter={false}
            className="w-11/12 sm:w-5/6 sm:max-w-none md:max-w-2xl lg:max-w-4xl p-0">
            <CommandInput
                placeholder="Search movies, TV shows, and files..."
                value={query}
                onValueChange={setQuery}
                className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-11 sm:h-12 text-sm sm:text-base"
            />
            <CommandList className="h-[70vh] sm:h-[75vh] overflow-y-auto">
                {isSearching && (
                    <>
                        {/* Show file results as soon as available */}
                        {hasFileResults && (
                            <CommandGroup
                                heading="Your Files"
                                className="**:[[cmdk-group-heading]]:px-1 sm:**:[[cmdk-group-heading]]:px-3 **:[[cmdk-group-heading]]:py-1.5 sm:**:[[cmdk-group-heading]]:py-2 **:[[cmdk-group-heading]]:text-xs **:[[cmdk-group-heading]]:font-semibold **:[[cmdk-group-heading]]:text-muted-foreground">
                                {fileResults.map(renderFileItem)}
                            </CommandGroup>
                        )}

                        {/* Show Trakt results as soon as available */}
                        {hasTraktResults && (
                            <CommandGroup
                                heading="Movies & TV Shows"
                                className="**:[[cmdk-group-heading]]:px-1 sm:**:[[cmdk-group-heading]]:px-3 **:[[cmdk-group-heading]]:py-1.5 sm:**:[[cmdk-group-heading]]:py-2 **:[[cmdk-group-heading]]:text-xs **:[[cmdk-group-heading]]:font-semibold **:[[cmdk-group-heading]]:text-muted-foreground">
                                {searchResults.map(renderMediaItem)}
                            </CommandGroup>
                        )}

                        {/* Show loading indicator if still searching */}
                        {(isFileSearching || isTraktSearching) && (
                            <div className="flex items-center justify-center py-4 text-xs text-muted-foreground border-b">
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                <span>Searching...</span>
                            </div>
                        )}

                        {/* Show end of results when both loaded and have results */}
                        {bothLoaded && hasAnyResults && (
                            <div className="flex items-center justify-center py-6 text-xs text-muted-foreground border-t">
                                <span>
                                    End of results • {(fileResults?.length || 0) + (searchResults?.length || 0)} item
                                    {(fileResults?.length || 0) + (searchResults?.length || 0) !== 1 ? "s" : ""} found
                                </span>
                            </div>
                        )}

                        {/* Show no results only when both searches are complete */}
                        {bothLoaded && !hasAnyResults && (
                            <div className="flex flex-col items-center justify-center py-8 sm:py-12 text-sm text-muted-foreground">
                                <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-muted mb-2 sm:mb-3">
                                    <Search className="h-5 w-5 sm:h-6 sm:w-6" />
                                </div>
                                <span className="font-medium text-sm sm:text-base">No results found</span>
                                <span className="text-xs mt-1 text-center px-4">
                                    Try different keywords or check your spelling
                                </span>
                            </div>
                        )}
                    </>
                )}

                {query.trim().length <= 2 && (
                    <div className="flex flex-col items-center justify-center py-8 sm:py-12 text-sm text-muted-foreground">
                        <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-muted mb-2 sm:mb-3">
                            <Search className="h-5 w-5 sm:h-6 sm:w-6" />
                        </div>
                        <span className="font-medium text-sm sm:text-base">Start searching</span>
                        <span className="text-xs mt-1 text-center px-4">Type at least 3 characters to see results</span>
                    </div>
                )}
            </CommandList>
        </CommandDialog>
    );
}
