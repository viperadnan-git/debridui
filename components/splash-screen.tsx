import Image from "next/image";
import { memo } from "react";

// `rerender-memo` - Static component, no props, safe to memoize
export const SplashScreen = memo(function SplashScreen() {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
            <div className="flex flex-col items-center gap-4">
                <Image
                    src="/icon.svg"
                    alt="DebridUI"
                    width={80}
                    height={80}
                    className="invert dark:invert-0 animate-pulse"
                    priority
                />
            </div>
        </div>
    );
});
