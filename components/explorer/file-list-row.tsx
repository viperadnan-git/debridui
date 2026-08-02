"use client";

import React, { useState } from "react";
import { useAuthGuaranteed } from "@/components/auth/auth-provider";
import { useFileSelectionState, useSelectionStore } from "@/lib/stores/selection";
import type { DebridFile } from "@/lib/types";
import { collectNodeIds, getTorrentFilesWithCache, processFileNodes } from "@/lib/utils/file";
import { ExpandedRow } from "./expanded-row";
import { FileListItem } from "./file-list-item";

interface FileListRowProps {
    file: DebridFile;
    autoExpand?: boolean;
}

export function FileListRow({ file, autoExpand = false }: FileListRowProps) {
    const { client, currentAccount } = useAuthGuaranteed();
    const isSelected = useFileSelectionState(file.id);
    const [isExpanded, setIsExpanded] = useState(
        autoExpand && (file.status === "completed" || file.status === "seeding")
    );
    const toggleFileSelection = useSelectionStore((state) => state.toggleFileSelection);

    const handleSelectFile = async () => {
        // Deselecting needs no file data — only selecting does
        if (isSelected === true) {
            toggleFileSelection(file.id);
            return;
        }
        // Providers that do not inline files have nothing cached until the row is expanded,
        // so a collapsed row must fetch before its links can be selected
        const nodes = await getTorrentFilesWithCache(file.id, client, currentAccount.id, file.files).catch(() => []);
        const processed = processFileNodes({ fileNodes: nodes });
        toggleFileSelection(file.id, collectNodeIds(processed), processed);
    };

    return (
        <React.Fragment>
            <FileListItem
                file={file}
                isSelected={isSelected}
                canExpand={file.status === "completed" || file.status === "seeding"}
                isExpanded={isExpanded}
                onToggleSelect={handleSelectFile}
                onToggleExpand={() => setIsExpanded((expanded) => !expanded)}
                className="[content-visibility:auto] [contain-intrinsic-size:auto_56px]"
            />
            {isExpanded && (
                <div id={`files-${file.id}`} className="border-b border-border/50 bg-muted/10">
                    <ExpandedRow file={file} />
                </div>
            )}
        </React.Fragment>
    );
}
