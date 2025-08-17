import {
    DebridFile,
    DebridFileStatus,
    DebridFileNode,
    DebridLinkInfo,
    DebridFileList,
} from "./types";
import { AccountType, User } from "@/lib/types";
import BaseClient from "./base";
import { USER_AGENT } from "../constants";

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
    deleted?: boolean;
};

type LiveModeResponse = {
    counter: number;
    fullsync: boolean;
    magnets: MagnetStatus[];
};

type MagnetBaseInfo = {
    id: number;
    name: string;
    size: number;
    hash: string;
    ready: boolean;
};

type MagnetBaseError = {
    error: {
        code: number;
        message: string;
    };
};

type AddFileResponse = {
    files: ({ file: string } & MagnetBaseInfo & MagnetBaseError)[];
};

type AddMagnetResponse = {
    magnets: ({ magnet: string } & MagnetBaseInfo & MagnetBaseError)[];
};

type RetryFileResponse = {
    magnets: ({ magnet: string; message?: string } & MagnetBaseError)[];
};

export default class AllDebridClient extends BaseClient {
    private sessionId: number;
    private counter: number = 0;
    private magnetsState: Map<number, MagnetStatus> = new Map();
    private magnetsOrder: number[] = []; // Track order with newest first

    constructor(private readonly account: User) {
        super();
        // Generate a random session ID for Live Mode
        this.sessionId = Math.floor(Math.random() * 1000000);
    }

    private fetch = async (path: string, options: RequestInit = {}) => {
        const { apiKey } = this.account;

        const response = await fetch(
            `https://api.alldebrid.com/v4.1/${path}?agent=${USER_AGENT}`,
            {
                ...options,
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    ...options.headers,
                },
            }
        );

        if (!response.ok) {
            throw new Error(`Failed to fetch ${path}: ${response.statusText}`);
        }

        const data = await response.json();

        AllDebridClient.throwError(data);

        return data.data;
    };

    static getUser = async (apiKey: string): Promise<User> => {
        const response = await fetch(
            `https://api.alldebrid.com/v4.1/user?agent=${USER_AGENT}`,
            {
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                },
            }
        );

        const data = await response.json();

        this.throwError(data);

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

    static getPin = async (): Promise<{
        pin: string;
        check: string;
        redirect_url: string;
    }> => {
        const response = await fetch(
            `https://api.alldebrid.com/v4.1/pin/get?agent=${USER_AGENT}`
        );

        const data = await response.json();

        this.throwError(data);

        return {
            pin: data.data.pin,
            check: data.data.check,
            redirect_url: data.data.user_url,
        };
    };

    static checkPin = async (
        pin: string,
        check: string,
        timeout: number = 600 * 1000 // 10 minutes
    ): Promise<{ success: boolean; apiKey?: string }> => {
        const form = new FormData();
        form.append("pin", pin);
        form.append("check", check);

        const now = Date.now();

        do {
            const response = await fetch(
                `https://api.alldebrid.com/v4.1/pin/check?agent=${USER_AGENT}`,
                {
                    method: "POST",
                    body: form,
                }
            );

            const data = await response.json();
            this.throwError(data);
            if (data.data.activated) {
                return {
                    success: true,
                    apiKey: data.data.apikey,
                };
            }
            await new Promise((resolve) => setTimeout(resolve, 1000)); // 1 second delay
        } while (Date.now() - now < timeout);

        throw new Error("Timeout while waiting for pin to be activated");
    };

    listFiles = async ({
        offset = 0,
        limit = 20,
    }: {
        offset?: number;
        limit?: number;
    } = {}): Promise<DebridFileList> => {
        await this.updateFiles();

        // Convert magnets state to DebridFile format using order array
        const files: DebridFile[] = [];
        const end = Math.min(offset + limit, this.magnetsOrder.length);

        for (let i = offset; i < end; i++) {
            const magnetId = this.magnetsOrder[i];
            const magnet = this.magnetsState.get(magnetId);

            if (magnet && magnet.filename) {
                files.push(this.parseMagnetStatus(magnet));
            }
        }

        return {
            files,
            offset,
            limit,
            hasMore: end < this.magnetsOrder.length,
        };
    };

    searchFiles = async (query: string): Promise<DebridFile[]> => {
        await this.updateFiles();

        const queries = query.split(" ");
        return Array.from(this.magnetsState.values())
            .filter((file) =>
                queries.every((query) =>
                    file.filename?.toLowerCase().includes(query.toLowerCase())
                )
            )
            .map(this.parseMagnetStatus);
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

    deleteFile = async (id: string): Promise<string> => {
        const form = new FormData();
        form.append("id", id);
        const data = await this.fetch(`magnet/delete`, {
            method: "POST",
            body: form,
        });

        this.removeDeletedMagnet(parseInt(id));
        return data.message;
    };

    retryFile = async (ids: string[]): Promise<Record<string, string>> => {
        const form = new FormData();
        ids.forEach((id) => {
            form.append("ids[]", id);
        });

        const data: RetryFileResponse = await this.fetch(`magnet/restart`, {
            method: "POST",
            body: form,
        });

        return data.magnets.reduce(
            (acc, magnet) => {
                acc[magnet.magnet] =
                    magnet?.message ||
                    magnet?.error?.message ||
                    "Unknown error";
                return acc;
            },
            {} as Record<string, string>
        );
    };

    addURI = async (uris: string[]): Promise<Record<string, string>> => {
        const httpUri: string[] = [];
        const magnetUri: string[] = [];
        uris.forEach((uri) => {
            const trimmedUri = uri.trim();
            if (trimmedUri.startsWith("http")) {
                httpUri.push(trimmedUri);
            } else {
                magnetUri.push(trimmedUri);
            }
        });

        const [httpData, magnetData] = await Promise.all([
            httpUri.length > 0 ? this.addHTTPUri(httpUri) : Promise.resolve({}),
            magnetUri.length > 0
                ? this.addMagnets(magnetUri)
                : Promise.resolve({}),
        ]);

        return { ...httpData, ...magnetData };
    };

    addMagnets = async (magnets: string[]): Promise<Record<string, string>> => {
        const form = new FormData();
        magnets.forEach((magnet) => {
            form.append("magnets[]", magnet);
        });
        const data: AddMagnetResponse = await this.fetch(`magnet/upload`, {
            method: "POST",
            body: form,
        });

        return data.magnets.reduce(
            (acc, magnet) => {
                acc[magnet.magnet] =
                    magnet?.error?.message || `Magnet ${magnet.name} added`;
                return acc;
            },
            {} as Record<string, string>
        );
    };

    addFile = async (files: File[]): Promise<Record<string, string>> => {
        const form = new FormData();
        files.forEach((file) => {
            form.append("files[]", file);
        });
        const data: AddFileResponse = await this.fetch(`magnet/upload/file`, {
            method: "POST",
            body: form,
        });

        return data.files.reduce(
            (acc, magnet) => {
                acc[magnet.file] =
                    magnet?.error?.message || `File ${magnet.name} added`;
                return acc;
            },
            {} as Record<string, string>
        );
    };

    private addHTTPUri = async (
        uris: string[]
    ): Promise<Record<string, string>> => {
        const results: Record<string, string> = {};

        const files = await Promise.all(
            uris.map(async (uri) => {
                try {
                    return await this.fetchFile(uri.trim());
                } catch (error) {
                    results[uri] = `Failed to fetch ${uri}: ${error}`;
                }
            })
        );

        return {
            ...results,
            ...(await this.addFile(files.filter(Boolean) as File[])),
        };
    };

    private fetchFile = async (uri: string): Promise<File> => {
        const response = await fetch(uri.trim());
        const blob = await response.blob();
        return new File([blob], uri.trim(), {
            type:
                response.headers.get("content-type") ||
                "application/x-bittorrent",
        });
    };

    private parseMagnetStatus = (magnet: MagnetStatus): DebridFile => {
        let progress;

        const status = this.getStatus(magnet.statusCode);
        if (status === "downloading" || status === "uploading") {
            const processed = magnet.uploaded || magnet.downloaded || 0;
            const percentage = (processed / (magnet.size || 0)) * 100;
            progress = percentage > 0 ? percentage.toFixed(2) : 0;
        }

        return {
            id: magnet.id.toString(),
            name: magnet.filename!,
            size: magnet.size || 0,
            status,
            progress,
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
        };
    };

    private updateFiles = async (): Promise<Map<number, MagnetStatus>> => {
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
            this.magnetsOrder = [];
            data.magnets.forEach((magnet) => {
                this.magnetsState.set(magnet.id, magnet);
                this.magnetsOrder.push(magnet.id);
            });
        } else {
            // Incremental update - merge changes with existing state
            const newMagnets: number[] = [];
            data.magnets.forEach((magnet) => {
                const existing = this.magnetsState.get(magnet.id);
                if (existing) {
                    if (magnet.deleted) {
                        this.removeDeletedMagnet(magnet.id);
                        return;
                    }
                    // Merge changes with existing state
                    this.magnetsState.set(magnet.id, {
                        ...existing,
                        ...magnet,
                    });
                } else {
                    // New magnet - add to front of order
                    this.magnetsState.set(magnet.id, magnet);
                    newMagnets.push(magnet.id);
                }
            });
            // Add new magnets to the front of the order array
            if (newMagnets.length > 0) {
                this.magnetsOrder = [...newMagnets, ...this.magnetsOrder];
            }
        }

        return this.magnetsState;
    };

    private removeDeletedMagnet = (magnetId: number): void => {
        if (this.magnetsState.delete(magnetId)) {
            this.magnetsOrder = this.magnetsOrder.filter(
                (id) => id !== magnetId
            );
        }
    };

    private parseFileNodes = (
        nodes: MagnetFileNode[] | MagnetFolderNode[]
    ): DebridFileNode[] => {
        return nodes.map(this.parseFileNode);
    };

    private parseFileNode = (
        node: MagnetFileNode | MagnetFolderNode
    ): DebridFileNode => {
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
            case 0:
                return "waiting";
            case 1:
                return "downloading";
            case 2:
                return "paused";
            case 3:
                return "uploading";
            case 4:
                return "completed";
            case 10:
            case 15:
            case 7:
                return "failed";
            default:
                return "unknown";
        }
    };

    private static throwError = (data: {
        status: string;
        error?: { message?: string };
    }) => {
        if (data.status !== "success") {
            throw new Error(data?.error?.message || "Unknown error");
        }
    };
}
