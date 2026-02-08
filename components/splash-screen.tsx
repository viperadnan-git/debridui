import Image from "next/image";
import { memo } from "react";

// `rerender-memo` - Static component, no props, safe to memoize
export const SplashScreen = memo(function SplashScreen() {
    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background">
            {/* Decorative elements */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {/* Subtle radial glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] bg-[radial-gradient(ellipse_at_center,var(--primary)_0%,transparent_70%)] opacity-[0.02]" />
                {/* Decorative lines */}
                <div className="absolute top-0 bottom-0 left-1/2 w-px bg-border/10" />
                <div className="absolute left-0 right-0 top-1/2 h-px bg-border/10" />
            </div>

            {/* Main content */}
            <div className="relative z-10 flex flex-col items-center gap-8">
                {/* Logo with refined animation */}
                <div
                    className="animate-in fade-in-0 zoom-in-95"
                    style={{
                        animationDuration: "400ms",
                        animationDelay: "0ms",
                        animationFillMode: "backwards",
                    }}>
                    <div className="relative">
                        {/* Subtle ring decoration */}
                        <div
                            className="absolute inset-0 rounded-full border border-border/20 animate-pulse"
                            style={{ animationDuration: "3s" }}
                        />
                        <div
                            className="absolute inset-0 rounded-full border border-primary/10 scale-110 animate-pulse"
                            style={{ animationDuration: "3s", animationDelay: "1.5s" }}
                        />

                        <div className="relative p-4">
                            <Image
                                src="/icon.svg"
                                alt="DebridUI"
                                width={56}
                                height={56}
                                className="invert dark:invert-0"
                                loading="eager"
                                priority
                            />
                        </div>
                    </div>
                </div>

                {/* Loading text with staggered reveal */}
                <div className="flex flex-col items-center gap-3">
                    <div
                        className="animate-in fade-in-0 slide-in-from-bottom-2"
                        style={{
                            animationDuration: "300ms",
                            animationDelay: "150ms",
                            animationFillMode: "backwards",
                        }}>
                        <span className="text-xs tracking-[0.3em] uppercase text-muted-foreground font-light">
                            Loading
                        </span>
                    </div>

                    {/* Animated progress dots */}
                    <div
                        className="flex items-center gap-1.5 animate-in fade-in-0"
                        style={{
                            animationDuration: "300ms",
                            animationDelay: "250ms",
                            animationFillMode: "backwards",
                        }}>
                        {[0, 1, 2].map((i) => (
                            <div
                                key={i}
                                className="size-1 rounded-full bg-primary/40 animate-pulse"
                                style={{
                                    animationDuration: "1.5s",
                                    animationDelay: `${i * 0.2}s`,
                                }}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
});
