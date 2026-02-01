import Image from "next/image";
import { memo } from "react";

// `rerender-memo` - Static component, no props, safe to memoize
export const SplashScreen = memo(function SplashScreen() {
    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-background">
            <Image
                src="/icon.svg"
                alt="DebridUI"
                width={64}
                height={64}
                className="invert dark:invert-0 animate-pulse"
                loading="eager"
            />
            <span className="text-xs tracking-widest uppercase text-muted-foreground">Loading</span>
        </div>
    );
});
