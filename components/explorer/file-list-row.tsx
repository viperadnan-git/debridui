"use client";

import React from "react";
import { DebridFile, DebridFileNode } from "@/lib/types";
import { FileListItem } from "./file-list-item";
import { ExpandedRow } from "./expanded-row";
import { useFileSelectionState, useSelectionStore } from "@/lib/stores/selection";
import { useState } from "react";
import { queryClient } from "@/lib/query-client";
import { processFileNodes } from "@/lib/utils/file";
import { getTorrentFilesCacheKey } from "@/lib/utils/cache-keys";
import { useAuthContext } from "@/lib/contexts/auth";

interface FileListRowProps {
    file: DebridFile;
    autoExpand?: boolean;
}

const collectNodeIds = (nodes: DebridFileNode[], result: string[] = []): string[] => {
    for (const node of nodes) {
        if (node.type === "file" && node.id) {
            result.push(node.id);
        }
        if (node.children) collectNodeIds(node.children, result);
    }
    return result;
};

export function FileListRow({ file, autoExpand = false }: FileListRowProps) {
    const { currentUser } = useAuthContext();
    const isSelected = useFileSelectionState(file.id);
    const [isExpanded, setIsExpanded] = useState(
        autoExpand && (file.status === "completed" || file.status === "seeding")
    );
    const toggleFileSelection = useSelectionStore((state) => state.toggleFileSelection);

    const handleSelectFile = () => {
        // Use files from DebridFile if available, otherwise check cache
        const fileNodes =
            file.files || queryClient.getQueryData<DebridFileNode[]>(getTorrentFilesCacheKey(currentUser.id, file.id));
        const processedFileNodes = processFileNodes({ fileNodes: fileNodes || [] });
        toggleFileSelection(file.id, processedFileNodes ? collectNodeIds(processedFileNodes) : []);
    };

    return (
        <React.Fragment>
            <FileListItem
                file={file}
                isSelected={isSelected}
                canExpand={file.status === "completed" || file.status === "seeding"}
                onToggleSelect={handleSelectFile}
                onToggleExpand={() => setIsExpanded(!isExpanded)}
            />
            {isExpanded && (
                <div className="border-b border-border/40 bg-muted/10">
                    <ExpandedRow file={file} />
                </div>
            )}
        </React.Fragment>
    );
}
