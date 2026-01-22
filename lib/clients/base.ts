import { User, DebridFileAddStatus, DebridFile, DebridFileNode, DebridLinkInfo } from "@/lib/types";

export default abstract class BaseClient {
    protected readonly user: User;
    constructor(user: User) {
        this.user = user;
    }

    protected async downloadFile(uri: string): Promise<File> {
        const response = await fetch(uri);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const blob = await response.blob();
        const contentType = response.headers.get("content-type") || "application/x-bittorrent";

        return new File([blob], uri, { type: contentType });
    }

    async addTorrent(uris: string[]): Promise<Record<string, DebridFileAddStatus>> {
        const httpUris: string[] = [];
        const magnetUris: string[] = [];

        for (const uri of uris) {
            const trimmedUri = uri.trim();
            if (trimmedUri.startsWith("http")) {
                httpUris.push(trimmedUri);
            } else {
                magnetUris.push(trimmedUri);
            }
        }

        const [httpResults, magnetResults] = await Promise.allSettled([
            httpUris.length > 0 ? this.addHttpDownloads(httpUris) : Promise.resolve({}),
            magnetUris.length > 0 ? this.addMagnetLinks(magnetUris) : Promise.resolve({}),
        ]);

        const httpData = httpResults.status === "fulfilled" ? httpResults.value : {};
        const magnetData = magnetResults.status === "fulfilled" ? magnetResults.value : {};

        return { ...httpData, ...magnetData };
    }

    protected async addHttpDownloads(httpUris: string[]): Promise<Record<string, DebridFileAddStatus>> {
        const results: Record<string, DebridFileAddStatus> = {};
        const downloadedFiles: File[] = [];

        await Promise.allSettled(
            httpUris.map(async (uri) => {
                try {
                    const file = await this.downloadFile(uri);
                    downloadedFiles.push(file);
                } catch (error) {
                    results[uri] = {
                        message: `Failed to download ${uri}: ${error}`,
                        error: error instanceof Error ? error.message : String(error),
                        is_cached: false,
                    };
                }
            })
        );

        if (downloadedFiles.length > 0) {
            const uploadResults = await this.uploadTorrentFiles(downloadedFiles);
            Object.assign(results, uploadResults);
        }

        return results;
    }

    abstract addMagnetLinks(magnetUris: string[]): Promise<Record<string, DebridFileAddStatus>>;
    abstract uploadTorrentFiles(files: File[]): Promise<Record<string, DebridFileAddStatus>>;
    abstract findTorrents(searchQuery: string): Promise<DebridFile[]>;
    abstract findTorrentById?(torrentId: string): Promise<DebridFile | null>;
    abstract getDownloadLink(params: { fileNode: DebridFileNode; resolve?: boolean }): Promise<DebridLinkInfo>;
}
