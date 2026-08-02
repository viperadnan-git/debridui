import type { DebridFolderNode, DebridNode } from "@/lib/types";

export interface FlatFile {
    path: string;
    id: string;
    size?: number;
}

/**
 * Build a nested folder tree from a flat provider file list so every client hands the UI the
 * same shape. Files with an empty id are dropped: Real-Debrid emits "" before unrestricting.
 */
export function buildTree(files: FlatFile[]): DebridNode[] {
    const root: DebridNode[] = [];
    const folders = new Map<string, DebridFolderNode>();

    for (const file of files) {
        if (!file.id) continue;

        const segments = file.path.split("/").filter(Boolean);
        const name = segments.pop();
        if (!name) continue;

        let level = root;
        let key = "";

        for (const segment of segments) {
            key = key ? `${key}/${segment}` : segment;
            let folder = folders.get(key);
            if (!folder) {
                folder = { name: segment, size: undefined, type: "folder", children: [] };
                folders.set(key, folder);
                level.push(folder);
            }
            level = folder.children;
        }

        level.push({ id: file.id, name, size: file.size, type: "file", children: [] });
    }

    return root;
}
