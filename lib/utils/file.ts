import {
    DebridFileNode,
    DebridLinkInfo,
    DebridFile,
    FileType,
} from "@/lib/types";
import { getFileType } from ".";
import { TRASH_SIZE_THRESHOLD } from "../constants";
import { format } from "date-fns";

export type SortOption = {
    value: string;
    label: string;
};

type SortOptionWithAccessor = SortOption & {
    accessor: (item: DebridFile) => string | number | Date;
};

export const sortOptions: SortOptionWithAccessor[] = [
    {
        value: "date",
        label: "Date Added",
        accessor: (file: DebridFile) => file.createdAt,
    },
    {
        value: "name",
        label: "Name",
        accessor: (file: DebridFile) => file.name.toLowerCase(),
    },
    {
        value: "size",
        label: "Size",
        accessor: (file: DebridFile) => file.size,
    },
    {
        value: "status",
        label: "Status",
        accessor: (file: DebridFile) => file.status,
    },
    {
        value: "progress",
        label: "Progress",
        accessor: (file: DebridFile) => file.progress || 0,
    },
    {
        value: "downloaded",
        label: "Downloaded",
        accessor: (file: DebridFile) => file.downloaded || 0,
    },
    {
        value: "downloadSpeed",
        label: "Download Speed",
        accessor: (file: DebridFile) => file.downloadSpeed || 0,
    },
];

export const sortFileNodes = (nodes: DebridFileNode[]): DebridFileNode[] => {
    return [...nodes].sort((a, b) => {
        // Folders first
        if (a.type === "folder" && b.type !== "folder") return -1;
        if (a.type !== "folder" && b.type === "folder") return 1;

        // If both are folders, sort by name
        if (a.type === "folder" && b.type === "folder") {
            return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
        }

        // Both are files - check file types
        const aFileType = getFileType(a.name);
        const bFileType = getFileType(b.name);

        // Videos second (after folders)
        if (aFileType === FileType.VIDEO && bFileType !== FileType.VIDEO)
            return -1;
        if (aFileType !== FileType.VIDEO && bFileType === FileType.VIDEO)
            return 1;

        // If both are videos or both are non-videos, sort by name
        return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
    });
};

export const filterTrashFiles = (nodes: DebridFileNode[]): DebridFileNode[] => {
    return nodes.filter((node) => {
        // Always show folders
        if (node.type === "folder") {
            return true;
        }

        // Show files larger than 1MB
        if (!node.size || node.size >= TRASH_SIZE_THRESHOLD) {
            return true;
        }

        // Show small files if they are media or archives
        const fileType = getFileType(node.name);
        return [
            FileType.VIDEO,
            FileType.AUDIO,
            FileType.IMAGE,
            FileType.ARCHIVE,
            FileType.DOCUMENT,
        ].includes(fileType);
    });
};

export const processFileNodes = (
    nodes: DebridFileNode[],
    smartOrder: boolean,
    hideTrash: boolean
): DebridFileNode[] => {
    // First filter out trash files
    let processedNodes = nodes;
    if (hideTrash) {
        processedNodes = filterTrashFiles(nodes);
    }

    if (smartOrder) {
        processedNodes = sortFileNodes(processedNodes);
    }

    return processedNodes.map((node) => {
        if (node.type === "folder" && node.children) {
            return {
                ...node,
                children: processFileNodes(
                    node.children,
                    smartOrder,
                    hideTrash
                ),
            };
        }
        return node;
    });
};

export const downloadM3U = (nodes: DebridLinkInfo[]) => {
    const nowString = format(new Date(), "yyyy-MM-dd-HH-mm-ss");
    let m3u = "#EXTM3U\n\n";
    m3u += nodes
        .map((node) => {
            return `#EXTINF:-1,${node.name}\n${node.link}\n`;
        })
        .join("\n");
    const blob = new Blob([m3u], { type: "application/x-mpegurl" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Playlist-${nowString}.m3u`;
    a.click();
};

export const sortTorrents = (
    torrents: DebridFile[],
    sortBy: string,
    sortOrder: "asc" | "desc"
) => {
    const sortOption = sortOptions.find((opt) => opt.value === sortBy);
    if (!sortOption) return;
    return torrents.sort((a, b) => {
        const aValue = sortOption.accessor(a);
        const bValue = sortOption.accessor(b);

        if (aValue === bValue) return 0;

        if (sortBy === "date") {
            const aDate = new Date(aValue).getTime();
            const bDate = new Date(bValue).getTime();
            return sortOrder === "desc" ? bDate - aDate : aDate - bDate;
        }

        if (typeof aValue === "number" && typeof bValue === "number") {
            return sortOrder === "desc" ? bValue - aValue : aValue - bValue;
        }

        const comparison = String(aValue).localeCompare(String(bValue));
        return sortOrder === "desc" ? -comparison : comparison;
    });
};
