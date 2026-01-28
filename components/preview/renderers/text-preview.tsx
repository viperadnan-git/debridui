"use client";

import { useState, useEffect } from "react";
import { DebridFileNode, AccountType } from "@/lib/types";
import { Loader2, AlertCircle } from "lucide-react";
import { useAuthGuaranteed } from "@/components/auth/auth-provider";
import { getProxyUrl } from "@/lib/utils";

interface TextPreviewProps {
    file: DebridFileNode;
    downloadUrl: string;
    onLoad?: () => void;
    onError?: (error: Error) => void;
}

export function TextPreview({ downloadUrl, onLoad, onError }: TextPreviewProps) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [content, setContent] = useState<string>("");
    const { currentUser } = useAuthGuaranteed();

    useEffect(() => {
        const fetchContent = async () => {
            try {
                setLoading(true);
                setError(null);

                const useProxy = currentUser.type === AccountType.ALLDEBRID;
                const fetchUrl = useProxy ? getProxyUrl(downloadUrl) : downloadUrl;

                const response = await fetch(fetchUrl);
                if (!response.ok) {
                    throw new Error(`Failed to fetch: ${response.statusText}`);
                }

                const text = await response.text();
                setContent(text);
                setLoading(false);
                onLoad?.();
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : "Failed to load file";
                setError(errorMessage);
                setLoading(false);
                onError?.(err instanceof Error ? err : new Error(errorMessage));
            }
        };

        fetchContent();
    }, [downloadUrl, currentUser.type, onLoad, onError]);

    if (loading) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-background text-foreground">
                <AlertCircle className="h-12 w-12 mb-2 text-destructive" />
                <p className="text-sm">Failed to load file</p>
                <p className="text-xs text-muted-foreground mt-1">{error}</p>
            </div>
        );
    }

    return (
        <div className="w-full h-full overflow-auto bg-background">
            <pre className="whitespace-pre-wrap font-mono text-sm text-foreground bg-foreground/10 min-h-full wrap-break-word p-6 max-w-4xl mx-auto">
                {content}
            </pre>
        </div>
    );
}
