import { DebridFileNode, DebridLinkInfo } from "../clients/types";
import { getFileType } from ".";
import { FileType } from "../types";
import { TRASH_SIZE_THRESHOLD } from "../constants";
import { format } from "date-fns";

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
