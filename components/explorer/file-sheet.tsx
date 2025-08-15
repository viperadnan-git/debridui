"use client";

import { DebridFile, DebridFileNode } from "@/lib/clients/types";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useAuthContext } from "@/app/(private)/layout";
import { Loader2, HardDrive, Download, Upload, Users, Gauge } from "lucide-react";
import { FileTree } from "./file-tree";
import { FileActions } from "./file-actions";
import { StatusBadge } from "../display";
import { formatSize, formatSpeed } from "@/lib/utils";

export function FileSheet({ file, open, onOpenChange }: { 
    file: DebridFile; 
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const { client } = useAuthContext();
    const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());

    const { data: nodes, isLoading, error } = useQuery<DebridFileNode[]>({
        queryKey: ["getFile", file.id],
        queryFn: () => client.getFile(file.id),
        enabled: open && file.status === "completed",
        staleTime: 300_000, // 5 minutes
    });

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                className="w-full sm:w-[600px] sm:max-w-[600px] lg:w-[700px] lg:max-w-[700px] overflow-y-auto p-3 sm:p-6"
                side="right"
            >
                <SheetHeader className="mb-3 sm:mb-4">
                    <SheetTitle className="text-base sm:text-lg truncate">{file.name}</SheetTitle>
                </SheetHeader>

                {/* File Info Card */}
                <Card className="mb-3 sm:mb-4">
                    <CardContent>
                        <div className="grid grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm">
                            <div className="flex items-center gap-1.5 sm:gap-2">
                                <HardDrive className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                                <span className="text-muted-foreground">Size:</span>
                                <span className="font-medium">{formatSize(file.size)}</span>
                            </div>
                            <div className="flex items-center gap-1.5 sm:gap-2">
                                <span className="text-muted-foreground">Status:</span>
                                <StatusBadge status={file.status} />
                            </div>
                            {file.progress !== undefined && (
                                <div className="flex items-center gap-1.5 sm:gap-2">
                                    <Gauge className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                                    <span className="text-muted-foreground">Progress:</span>
                                    <span className="font-medium">{file.progress}%</span>
                                </div>
                            )}
                            {file.downloadSpeed !== undefined && (
                                <div className="flex items-center gap-1.5 sm:gap-2">
                                    <Download className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                                    <span className="text-muted-foreground">DL:</span>
                                    <span className="font-medium">{formatSpeed(file.downloadSpeed)}</span>
                                </div>
                            )}
                            {file.uploadSpeed !== undefined && (
                                <div className="flex items-center gap-1.5 sm:gap-2">
                                    <Upload className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                                    <span className="text-muted-foreground">UL:</span>
                                    <span className="font-medium">{formatSpeed(file.uploadSpeed)}</span>
                                </div>
                            )}
                            {file.peers !== undefined && (
                                <div className="flex items-center gap-1.5 sm:gap-2">
                                    <Users className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                                    <span className="text-muted-foreground">Peers:</span>
                                    <span className="font-medium">{file.peers}</span>
                                </div>
                            )}
                        </div>
                        {file.progress !== undefined && (
                            <div className="mt-3">
                                <div className="w-full bg-secondary rounded-full h-1.5 sm:h-2">
                                    <div 
                                        className="bg-primary h-1.5 sm:h-2 rounded-full transition-all"
                                        style={{ width: `${file.progress}%` }}
                                    />
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Action Buttons */}
                <div className="mb-3 sm:mb-4">
                    <div className="flex items-center justify-between">
                        <span className="text-xs sm:text-sm text-muted-foreground">
                            {selectedFiles.size} file{selectedFiles.size !== 1 ? 's' : ''} selected
                        </span>
                        <FileActions selectedFiles={selectedFiles} fileId={file.id} />
                    </div>
                </div>

                {/* File Tree */}
                <div className="border rounded-lg p-2 sm:p-3">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : error ? (
                        <div className="text-center py-4 text-xs sm:text-sm text-red-500">
                            Error loading files: {(error as Error).message}
                        </div>
                    ) : nodes && nodes.length > 0 ? (
                        <FileTree 
                            nodes={nodes} 
                            selectedFiles={selectedFiles}
                            onSelectionChange={setSelectedFiles}
                            fileId={file.id}
                        />
                    ) : (
                        <div className="text-center py-4 text-xs sm:text-sm text-muted-foreground">
                            No files found
                        </div>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}
