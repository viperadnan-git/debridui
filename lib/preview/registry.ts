import { FileType, DebridFileNode } from "../types";
import { getFileType } from "../utils";

export type PreviewRendererComponent = React.ComponentType<{
    file: DebridFileNode;
    downloadUrl: string;
    onLoad?: () => void;
    onError?: (error: Error) => void;
}>;

export type PreviewRenderer = {
    id: string;
    fileTypes: FileType[];
    component: PreviewRendererComponent;
    canPreview: (fileType: FileType) => boolean;
};

// Registry will be populated as we add renderers
const previewRegistry: PreviewRenderer[] = [];

export function registerPreviewRenderer(renderer: PreviewRenderer) {
    // Check if renderer with same id already exists
    const existingIndex = previewRegistry.findIndex((r) => r.id === renderer.id);
    if (existingIndex >= 0) {
        // Replace existing renderer
        previewRegistry[existingIndex] = renderer;
    } else {
        // Add new renderer
        previewRegistry.push(renderer);
    }
}

export function getPreviewRenderer(fileType: FileType): PreviewRenderer | null {
    return previewRegistry.find((r) => r.canPreview(fileType)) || null;
}

export function canPreviewFile(fileType: FileType): boolean {
    return previewRegistry.some((r) => r.canPreview(fileType));
}

export function filterPreviewableFiles(files: DebridFileNode[]): DebridFileNode[] {
    return files.filter((file) => {
        if (file.type !== "file") return false;
        const fileType = getFileType(file.name);
        return canPreviewFile(fileType);
    });
}
