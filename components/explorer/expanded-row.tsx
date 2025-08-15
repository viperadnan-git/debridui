"use client";

import { DebridFile, DebridFileNode } from "@/lib/clients/types";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { useAuthContext } from "@/app/(private)/layout";
import { Loader2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { FileTree } from "./file-tree";
import { FileActions } from "./file-actions";
import { useSettingsStore } from "@/lib/stores/settings";
import { processFileNodes } from "@/lib/file-utils";

export function ExpandedRow({ file }: { file: DebridFile }) {
    const { client } = useAuthContext();
    const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
    const { smartOrder, hideTrash, setSmartOrder, setHideTrash } = useSettingsStore();

    const { data: nodes, isLoading, error } = useQuery<DebridFileNode[]>({
        queryKey: ["getFile", file.id],
        queryFn: () => client.getFile(file.id),
        enabled: file.status === "completed",
        staleTime: 300_000, // 5 minutes
    });

    // Process nodes with smart order and trash filtering
    const processedNodes = useMemo(() => {
        if (!nodes) return [];
        return processFileNodes(nodes, smartOrder, hideTrash);
    }, [nodes, smartOrder, hideTrash]);

    return (
        <div className="px-0.5 py-2 md:px-4">
            {/* Mobile Layout - 2 rows */}
            <div className="flex flex-col gap-3 md:hidden">
                {/* Row 1: File Actions */}
                <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                        {selectedFiles.size} file{selectedFiles.size !== 1 ? 's' : ''} selected
                    </span>
                    <FileActions selectedFiles={selectedFiles} fileId={file.id} />
                </div>
                
                {/* Row 2: Settings Switches */}
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Switch
                            id="smart-order-mobile"
                            checked={smartOrder}
                            onCheckedChange={setSmartOrder}
                        />
                        <Label htmlFor="smart-order-mobile" className="text-xs">
                            Smart Order
                        </Label>
                    </div>
                    <div className="flex items-center gap-2">
                        <Switch
                            id="hide-trash-mobile"
                            checked={hideTrash}
                            onCheckedChange={setHideTrash}
                        />
                        <Label htmlFor="hide-trash-mobile" className="text-xs">
                            Hide Trash
                        </Label>
                    </div>
                </div>
            </div>

            {/* Desktop Layout - Single row */}
            <div className="hidden md:flex items-center justify-between mb-3">
                <div className="flex items-center gap-6">
                    <span className="text-sm text-muted-foreground">
                        {selectedFiles.size} file{selectedFiles.size !== 1 ? 's' : ''} selected
                    </span>
                    
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <Switch
                                id="smart-order-desktop"
                                checked={smartOrder}
                                onCheckedChange={setSmartOrder}
                            />
                            <Label htmlFor="smart-order-desktop" className="text-sm">
                                Smart Order
                            </Label>
                        </div>
                        <div className="flex items-center gap-2">
                            <Switch
                                id="hide-trash-desktop"
                                checked={hideTrash}
                                onCheckedChange={setHideTrash}
                            />
                            <Label htmlFor="hide-trash-desktop" className="text-sm">
                                Hide Trash
                            </Label>
                        </div>
                    </div>
                </div>
                
                <FileActions selectedFiles={selectedFiles} fileId={file.id} />
            </div>

            {/* File Tree */}
            <div className="p-2 sm:p-3 mt-3 md:mt-0">
                {isLoading ? (
                    <div className="flex items-center justify-center py-4">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                ) : error ? (
                    <div className="text-center py-4 text-xs text-red-500">
                        Error loading files
                    </div>
                ) : processedNodes && processedNodes.length > 0 ? (
                    <FileTree 
                        nodes={processedNodes} 
                        selectedFiles={selectedFiles}
                        onSelectionChange={setSelectedFiles}
                        fileId={file.id}
                    />
                ) : (
                    <div className="text-center py-4 text-xs text-muted-foreground">
                        {hideTrash && nodes && nodes.length > 0 
                            ? "All files hidden (enable 'Hide Trash' to show them)"
                            : "No files found"
                        }
                    </div>
                )}
            </div>
        </div>
    );
}