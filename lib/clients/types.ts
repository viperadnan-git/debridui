export type DebridFileNode = {
    id?: string;
    name: string;
    size: number | undefined;
    type: "file" | "folder";
    children: DebridFileNode[];
}

export type DebridFile = {
    id: string;
    name: string;
    size: number;

    status: DebridFileStatus;
    progress?: number;
    downloadSpeed?: number;
    uploadSpeed?: number;
    uploaded?: number;
    downloaded?: number;
    peers?: number;

    createdAt: Date;
    completedAt?: Date;

    error?: string;
}

export type DebridFileList = {
    files: DebridFile[];
    offset: number;
    limit: number;
    hasMore: boolean;
}

export type DebridFileStatus = "downloading" | "uploading" | "seeding" | "paused" | "completed" | "failed" | "unknown";

export type DebridLinkInfo = {
    link: string;
    name: string;
    size: number;
}