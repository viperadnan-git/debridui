import { DebridFileNode } from "./clients/types";
import { getFileType } from "./utils";
import { FileType } from "./types";

const TRASH_SIZE_THRESHOLD = 1024 * 1024; // 1MB in bytes

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
        if (aFileType === FileType.VIDEO && bFileType !== FileType.VIDEO) return -1;
        if (aFileType !== FileType.VIDEO && bFileType === FileType.VIDEO) return 1;

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
                children: processFileNodes(node.children, smartOrder, hideTrash),
            };
        }
        return node;
    });
};
