"use client";

import { DebridFile, DebridFileNode } from "@/lib/clients/types";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useAuthContext } from "@/app/(private)/layout";
import { Loader2 } from "lucide-react";
import { FileTree } from "./file-tree";
import { FileActions } from "./file-actions";

export function ExpandedRow({ file }: { file: DebridFile }) {
    const { client } = useAuthContext();
    const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());

    const { data: nodes, isLoading, error } = useQuery<DebridFileNode[]>({
        queryKey: ["getFile", file.id],
        queryFn: () => client.getFile(file.id),
        enabled: file.status === "completed",
        staleTime: 300_000, // 5 minutes
    });

    return (
        <div className="p-4">
            {/* Action Buttons */}
            <div className="mb-3 flex items-center justify-between">
                <span className="text-xs sm:text-sm text-muted-foreground">
                    {selectedFiles.size} file{selectedFiles.size !== 1 ? 's' : ''} selected
                </span>
                <FileActions selectedFiles={selectedFiles} fileId={file.id} />
            </div>

            {/* File Tree */}
            <div className="border rounded-lg p-2 sm:p-3 bg-background">
                {isLoading ? (
                    <div className="flex items-center justify-center py-4">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                ) : error ? (
                    <div className="text-center py-4 text-xs text-red-500">
                        Error loading files
                    </div>
                ) : nodes && nodes.length > 0 ? (
                    <FileTree 
                        nodes={nodes} 
                        selectedFiles={selectedFiles}
                        onSelectionChange={setSelectedFiles}
                        fileId={file.id}
                    />
                ) : (
                    <div className="text-center py-4 text-xs text-muted-foreground">
                        No files found
                    </div>
                )}
            </div>
        </div>
    );
}