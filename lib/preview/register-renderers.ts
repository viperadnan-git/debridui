import { registerPreviewRenderer } from "./registry";
import { FileType } from "../types";
import { ImagePreview } from "@/components/preview/renderers/image-preview";
import { VideoPreview } from "@/components/preview/renderers/video-preview";
import { TextPreview } from "@/components/preview/renderers/text-preview";

// Register image preview renderer
registerPreviewRenderer({
    id: "image",
    fileTypes: [FileType.IMAGE],
    component: ImagePreview,
    canPreview: (type) => type === FileType.IMAGE,
});

// Register video preview renderer
registerPreviewRenderer({
    id: "video",
    fileTypes: [FileType.VIDEO],
    component: VideoPreview,
    canPreview: (type) => type === FileType.VIDEO,
});

// Register text preview renderer
registerPreviewRenderer({
    id: "text",
    fileTypes: [FileType.TEXT],
    component: TextPreview,
    canPreview: (type) => type === FileType.TEXT,
});
