"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error(error);
    }, [error]);

    return (
        <div className="flex flex-col items-center justify-center h-screen gap-8 p-4">
            <div className="flex flex-col items-center justify-center gap-4 text-center">
                <AlertCircle className="h-16 w-16 text-destructive" />
                <h1 className="text-4xl font-bold">Something went wrong!</h1>
                <p className="text-lg text-muted-foreground max-w-md">
                    {error.message || "An unexpected error occurred"}
                </p>
                {error.digest && (
                    <p className="text-sm text-muted-foreground">
                        Error ID: <code className="bg-muted px-2 py-1 rounded">{error.digest}</code>
                    </p>
                )}
            </div>
            <div className="flex gap-4">
                <Button onClick={reset}>Try again</Button>
                <Button variant="outline" asChild>
                    <a href="/dashboard">Go to Dashboard</a>
                </Button>
            </div>
        </div>
    );
}
