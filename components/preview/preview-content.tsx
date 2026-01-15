"use client";

import { DebridFileNode } from "@/lib/types";
import { getFileType } from "@/lib/utils";
import { getPreviewRenderer } from "@/lib/preview/registry";
import { AlertCircle } from "lucide-react";

interface PreviewContentProps {
    file: DebridFileNode;
    downloadUrl: string;
}

export function PreviewContent({ file, downloadUrl }: PreviewContentProps) {
    const fileType = getFileType(file.name);
    const renderer = getPreviewRenderer(fileType);

    if (!renderer) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <AlertCircle className="h-12 w-12 mb-2" />
                <p className="text-sm">Preview not available for this file type</p>
                <p className="text-xs mt-1 text-muted-foreground/70">{file.name}</p>
            </div>
        );
    }

    const RendererComponent = renderer.component;
    return <RendererComponent key={downloadUrl} file={file} downloadUrl={downloadUrl} />;
}
