"use client";

import { useWebDownloads } from "./web-downloads-provider";
import { DownloadItem, DownloadItemSkeleton } from "./download-item";
import { Link2Off } from "lucide-react";

export function DownloadList() {
    const { downloads, isLoading, deleteDownload, getDownloadLink } = useWebDownloads();

    if (isLoading) {
        return (
            <div className="rounded-sm border border-border/50 bg-card overflow-hidden">
                {[1, 2, 3].map((i) => (
                    <DownloadItemSkeleton key={i} />
                ))}
            </div>
        );
    }

    if (downloads.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <Link2Off className="size-10 text-muted-foreground/50 mb-3" />
                <p className="text-sm font-light text-foreground">No downloads yet</p>
                <p className="text-xs text-muted-foreground mt-1">
                    Add links above to unlock and download files from supported hosters
                </p>
            </div>
        );
    }

    return (
        <div className="rounded-sm border border-border/50 bg-card overflow-hidden">
            {downloads.map((download) => (
                <DownloadItem
                    key={download.id}
                    download={download}
                    onDelete={deleteDownload}
                    onGetLink={getDownloadLink}
                />
            ))}
        </div>
    );
}
