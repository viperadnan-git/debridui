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
            {/* Decorative background elements */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {/* Subtle error-state glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[50%] h-[50%] bg-[radial-gradient(ellipse_at_center,hsl(var(--destructive))_0%,transparent_70%)] opacity-[0.03]" />
                {/* Decorative grid lines */}
                <div className="absolute top-0 bottom-0 left-1/2 w-px bg-border/10" />
                <div className="absolute left-0 right-0 top-1/2 h-px bg-border/10" />
            </div>

            {/* Error content with staggered animations */}
            <div className="relative z-10 flex flex-col items-center gap-8 px-6 py-12 max-w-md w-full">
                {/* Icon with decorative frame */}
                <div
                    className="animate-in fade-in-0 zoom-in-95"
                    style={{
                        animationDuration: "400ms",
                        animationDelay: "0ms",
                        animationFillMode: "backwards",
                    }}>
                    <div className="relative">
                        {/* Frame decoration */}
                        <div className="absolute -inset-4 border border-border/30 rounded-sm" />
                        <div className="absolute -inset-2 border border-destructive/10 rounded-sm" />

                        <AlertCircle className="size-10 text-destructive/80" strokeWidth={1.25} />
                    </div>
                </div>

                {/* Text content */}
                <div className="space-y-6 text-center w-full">
                    {/* Title with accent line */}
                    <div
                        className="space-y-3 animate-in fade-in-0 slide-in-from-bottom-3"
                        style={{
                            animationDuration: "300ms",
                            animationDelay: "150ms",
                            animationFillMode: "backwards",
                        }}>
                        <div className="flex items-center justify-center gap-3">
                            <div className="h-px w-8 bg-border/50" />
                            <h1 className="text-xl sm:text-2xl font-light tracking-tight">{title}</h1>
                            <div className="h-px w-8 bg-border/50" />
                        </div>
                    </div>

                    {/* Error message */}
                    <div
                        className="animate-in fade-in-0 slide-in-from-bottom-2"
                        style={{
                            animationDuration: "300ms",
                            animationDelay: "250ms",
                            animationFillMode: "backwards",
                        }}>
                        <div className="px-4 py-3 bg-muted/30 border border-border/50 rounded-sm">
                            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                                {error?.message || "Failed to load your account"}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Action buttons */}
                <div
                    className="flex flex-col sm:flex-row gap-3 w-full animate-in fade-in-0 slide-in-from-bottom-2"
                    style={{
                        animationDuration: "300ms",
                        animationDelay: "350ms",
                        animationFillMode: "backwards",
                    }}>
                    {onRetry && (
                        <Button onClick={onRetry} size="default" className="flex-1 h-10">
                            Try Again
                        </Button>
                    )}
                    {onDelete && (
                        <Button
                            variant="outline"
                            onClick={onDelete}
                            className="flex-1 h-10 border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive">
                            Remove Account
                        </Button>
                    )}
                    {onLogout && (
                        <Button variant="outline" onClick={onLogout} className="flex-1 h-10">
                            Logout
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
