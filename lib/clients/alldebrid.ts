import { DebridFile, DebridFileStatus, DebridFileNode, DebridLinkInfo, DebridFileList } from "./types";
import { AccountType, User } from "@/lib/types";
import BaseClient from "./base";

type MagnetFileNode = {
    n: string;
    s: number;
    l: string;
};

type MagnetFolderNode = {
    n: string;
    e: MagnetFileNode[];
};

type MagnetFile = {
    id: string;
    files: MagnetFileNode[] | MagnetFolderNode[];
};

// Live Mode types for magnet status
type MagnetStatus = {
    id: number;
    filename?: string;
    size?: number;
    status?: string;
    statusCode: number;
    downloaded?: number;
    uploaded?: number;
    seeders?: number;
    downloadSpeed?: number;
    uploadSpeed?: number;
    uploadDate: number;
    completionDate?: number;
    processingPerc?: number;
};

type LiveModeResponse = {
    counter: number;
    fullsync: boolean;
    magnets: MagnetStatus[];
};

export default class AllDebridClient extends BaseClient {
    private sessionId: number;
    private counter: number = 0;
    private magnetsState: Map<number, MagnetStatus> = new Map();

    constructor(private readonly account: User) {
        super();
        // Generate a random session ID for Live Mode
        this.sessionId = Math.floor(Math.random() * 1000000);
    }

    private fetch = async (path: string, options: RequestInit = {}) => {
        const { apiKey } = this.account;

        const response = await fetch(`https://api.alldebrid.com/v4.1/${path}`, {
            ...options,
            headers: {
                Authorization: `Bearer ${apiKey}`,
                ...options.headers,
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch ${path}: ${response.statusText}`);
        }

        const data = await response.json();

        if (data.status !== "success") {
            throw new Error(data?.error?.message || "Unknown error");
        }

        return data.data;
    };

    static getUser = async (apiKey: string): Promise<User> => {
        const response = await fetch("https://api.alldebrid.com/v4.1/user", {
            headers: {
                Authorization: `Bearer ${apiKey}`,
            },
        });

        const data = await response.json();

        if (data.status !== "success") {
            throw new Error(data?.error?.message || "Unknown error");
        }

        const user = data.data.user;
        const userPremium = user.premiumUntil;
        const isPremium = userPremium && userPremium > new Date().getTime();

        return {
            id: crypto.randomUUID(),
            apiKey,
            type: AccountType.ALLDEBRID,
            username: user.username,
            email: user.email,
            language: user.language,
            isPremium,
            premiumExpiresAt: new Date(userPremium),
        };
    };

    listFiles = async ({
        offset = 0,
        limit = 20,
    }: {
        offset?: number;
        limit?: number;
    } = {}): Promise<DebridFileList> => {
        // Use Live Mode to get magnet status
        const form = new FormData();
        form.append("session", this.sessionId.toString());
        form.append("counter", this.counter.toString());

        const data = (await this.fetch(`magnet/status`, {
            method: "POST",
            body: form,
        })) as LiveModeResponse;

        // Update counter for next call
        this.counter = data.counter;

        // Handle Live Mode response
        if (data.fullsync) {
            // Full sync - reset state and store all magnets
            this.magnetsState.clear();
            data.magnets.forEach((magnet) => {
                this.magnetsState.set(magnet.id, magnet);
            });
        } else {
            // Incremental update - merge changes with existing state
            data.magnets.forEach((magnet) => {
                const existing = this.magnetsState.get(magnet.id);
                console.log("existing", existing);
                console.log("magnet", magnet);
                if (existing) {
                    // Merge changes with existing state
                    this.magnetsState.set(magnet.id, { ...existing, ...magnet });
                } else {
                    // New magnet
                    console.log("new magnet", magnet);
                    this.magnetsState.set(magnet.id, magnet);
                }
            });
        }

        // Convert magnets state to DebridFile format
        const files: DebridFile[] = [];
        const entries = Array.from(this.magnetsState.entries());
        const end = offset + limit;
        for (const [id, magnet] of entries.slice(offset, end)) {
            if (magnet.filename) {
                const status = this.getStatus(magnet.statusCode);
                files.push({
                    id: id.toString(),
                    name: magnet.filename,
                    size: magnet.size || 0,
                    status,
                    progress: magnet.processingPerc,
                    downloadSpeed: magnet.downloadSpeed,
                    uploadSpeed: magnet.uploadSpeed,
                    uploaded: magnet.uploaded,
                    downloaded: magnet.downloaded,
                    peers: magnet.seeders,
                    createdAt: new Date(magnet.uploadDate * 1000),
                    completedAt: magnet.completionDate
                        ? new Date(magnet.completionDate * 1000)
                        : undefined,
                    error: status === "failed" ? magnet.status : undefined,
                });
            }
        }

        return {
            files,
            offset,
            limit,
            hasMore: end < entries.length,
        };
    };

    searchFiles = async (query: string): Promise<DebridFile[]> => {
        const list = await this.listFiles();
        const queries = query.split(" ");
        return list.files.filter((file) =>
            queries.every((query) => file.name.toLowerCase().includes(query.toLowerCase()))
        );
    };

    getNodeDownloadUrl = async (fileId: string): Promise<DebridLinkInfo> => {
        const form = new FormData();
        form.append("link", fileId);

        const data = await this.fetch(`link/unlock`, {
            method: "POST",
            body: form,
        });

        return {
            link: data.link,
            name: data.filename,
            size: data.filesize,
        };
    };

    /**
     * Get the full magnet status data using Live Mode
     * Returns the complete state of all magnets
     */
    getMagnetStatus = async (): Promise<MagnetStatus[]> => {
        const form = new FormData();
        form.append("session", this.sessionId.toString());
        form.append("counter", this.counter.toString());

        const data = (await this.fetch(`magnet/status`, {
            method: "POST",
            body: form,
        })) as LiveModeResponse;

        // Update counter for next call
        this.counter = data.counter;

        // Handle Live Mode response
        if (data.fullsync) {
            // Full sync - reset state and store all magnets
            this.magnetsState.clear();
            data.magnets.forEach((magnet) => {
                this.magnetsState.set(magnet.id, magnet);
            });
        } else {
            // Incremental update - merge changes with existing state
            data.magnets.forEach((magnet) => {
                const existing = this.magnetsState.get(magnet.id);
                if (existing) {
                    // Merge changes with existing state
                    this.magnetsState.set(magnet.id, { ...existing, ...magnet });
                } else {
                    // New magnet
                    this.magnetsState.set(magnet.id, magnet);
                }
            });
        }

        return Array.from(this.magnetsState.values());
    };

    getFile = async (id: string): Promise<DebridFileNode[]> => {
        const form = new FormData();
        form.append("id[]", id);

        const data = await this.fetch(`magnet/files`, {
            method: "POST",
            body: form,
        });

        const magnet = data.magnets[0] as MagnetFile;
        const files = magnet.files;

        return this.parseFileNodes(files);
    };

    private parseFileNodes = (nodes: MagnetFileNode[] | MagnetFolderNode[]): DebridFileNode[] => {
        return nodes.map(this.parseFileNode);
    };

    private parseFileNode = (node: MagnetFileNode | MagnetFolderNode): DebridFileNode => {
        if ("e" in node) {
            return {
                name: node.n,
                size: undefined,
                type: "folder",
                children: node.e.map(this.parseFileNode),
            };
        }

        return {
            id: node.l,
            name: node.n,
            size: node.s,
            type: "file",
            children: [],
        };
    };

    private getStatus = (status: number): DebridFileStatus => {
        switch (status) {
            case 1:
                return "downloading";
            case 2:
                return "paused";
            case 3:
                return "uploading";
            case 4:
                return "completed";
            case 10:
                return "failed";
            default:
                return "unknown";
        }
    };
}
