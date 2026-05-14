"use client";

import { Eye, EyeOff } from "lucide-react";
import { type ComponentProps, useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface PasswordInputProps extends Omit<ComponentProps<typeof Input>, "type"> {
    /** Initial reveal state. Defaults to false (masked). */
    defaultRevealed?: boolean;
    /** Override input type when revealed. Defaults to "text". */
    revealAs?: "text" | "email" | "url";
}

export function PasswordInput({
    className,
    defaultRevealed = false,
    revealAs = "text",
    disabled,
    ...props
}: PasswordInputProps) {
    const [revealed, setRevealed] = useState(defaultRevealed);
    const ToggleIcon = revealed ? EyeOff : Eye;

    return (
        <div className="relative">
            <Input
                {...props}
                type={revealed ? revealAs : "password"}
                disabled={disabled}
                className={cn("pr-9", className)}
            />
            <button
                type="button"
                onClick={() => setRevealed((v) => !v)}
                disabled={disabled}
                tabIndex={-1}
                aria-label={revealed ? "Hide value" : "Show value"}
                aria-pressed={revealed}
                className="absolute inset-y-0 right-0 inline-flex w-9 items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer disabled:pointer-events-none disabled:opacity-50">
                <ToggleIcon className="size-4" strokeWidth={1.5} />
            </button>
        </div>
    );
}
