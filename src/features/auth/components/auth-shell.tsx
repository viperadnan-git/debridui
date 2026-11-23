import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

interface AuthShellProps {
    title: string;
    description?: ReactNode;
    footer?: ReactNode;
    children: ReactNode;
}

/** Centered logo + heading frame shared by the public auth pages. */
export function AuthShell({ title, description, footer, children }: AuthShellProps) {
    return (
        <div className="bg-background grid grid-rows-[1fr_auto] min-h-svh p-6 md:p-10 pt-[max(env(safe-area-inset-top),1.5rem)] pb-[max(env(safe-area-inset-bottom),1.5rem)]">
            <div className="flex items-center justify-center">
                <div className="w-full max-w-sm">
                    <div className="flex flex-col items-center gap-2 mb-6">
                        <Link href="/" className="flex flex-col items-center gap-2 font-medium">
                            <div className="flex size-12 items-center justify-center">
                                <Image
                                    src="/icon.svg"
                                    alt="DebridUI"
                                    width={48}
                                    height={48}
                                    className="invert dark:invert-0"
                                />
                            </div>
                            <span className="sr-only">DebridUI</span>
                        </Link>
                        <h1 className="text-xl font-bold">{title}</h1>
                        {description && <p className="text-sm text-muted-foreground text-center">{description}</p>}
                    </div>
                    {children}
                </div>
            </div>
            {footer && <footer className="flex items-center justify-center pb-6">{footer}</footer>}
        </div>
    );
}
