import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SplashErrorScreenProps {
    title?: string;
    error?: Error | null;
    onRetry?: () => void;
    onDelete?: () => void;
    onLogout?: () => void;
}

export function SplashErrorScreen({
    title = "Connection Error",
    error,
    onRetry,
    onDelete,
    onLogout,
}: SplashErrorScreenProps) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
            <div className="flex flex-col items-center gap-4 text-center p-6">
                <AlertCircle className="h-12 w-12 text-destructive" />
                <h1 className="text-xl font-bold">{title}</h1>
                <p className="text-sm text-muted-foreground">{error?.message || "Failed to load your account"}</p>
                <div className="flex gap-2">
                    {onRetry && <Button onClick={onRetry}>Try Again</Button>}
                    {onDelete && (
                        <Button variant="destructive" onClick={onDelete}>
                            Remove Account
                        </Button>
                    )}
                    {onLogout && (
                        <Button variant="outline" onClick={onLogout}>
                            Logout
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
