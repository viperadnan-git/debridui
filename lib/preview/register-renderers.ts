import { registerPreviewRenderer } from "./registry";
import { FileType } from "../types";
import { ImagePreview } from "@/components/preview/renderers/image-preview";
import { VideoPreview } from "@/components/preview/renderers/video-preview";

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
