import { ArrowLeft, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface BackLink {
    label?: string;
    onClick: () => void;
}

interface PageHeaderProps {
    /** Icon rendered to the left of the title. Lucide component or any node. */
    icon?: LucideIcon | ReactNode;
    /** Editorial kicker label above the title (small tracked caps). Overrides default accent line. */
    eyebrow?: ReactNode;
    /** Optional back affordance above the title. */
    back?: BackLink;
    /** Title — string or a custom node (e.g. <Skeleton />). */
    title: ReactNode;
    /** Supporting description under the title. */
    description?: ReactNode;
    /** Dot-separated metadata row below the description. */
    meta?: ReactNode[];
    /** Compact action(s) pinned to the title row at all breakpoints (icon buttons / status indicators). */
    primaryAction?: ReactNode;
    /** Show hairline divider below the header. */
    divider?: boolean;
    /** Show a short editorial accent line above the title. */
    accent?: boolean;
    /** Override outer wrapper classes (e.g. extra bottom padding). */
    className?: string;
}

function isLucide(node: unknown): node is LucideIcon {
    if (typeof node === "function") return true;
    return typeof node === "object" && node !== null && "render" in node;
}

export function PageHeader({
    icon,
    eyebrow,
    back,
    title,
    description,
    meta,
    primaryAction,
    divider = false,
    accent = false,
    className,
}: PageHeaderProps) {
    const Icon = isLucide(icon) ? icon : null;
    const iconNode = Icon ? (
        <Icon className="size-5 sm:size-6 text-primary shrink-0 -translate-y-px" strokeWidth={1.5} />
    ) : icon ? (
        <span className="shrink-0 text-primary -translate-y-px">{icon as ReactNode}</span>
    ) : null;

    const hasKicker = !!back || !!eyebrow || accent;

    return (
        <div className={cn(divider ? "space-y-8 sm:space-y-10" : undefined, className)}>
            <div className="min-w-0 space-y-1 sm:space-y-1.5">
                {hasKicker && (
                    <div className={cn("flex items-center gap-2.5", back ? "pb-1.5 sm:pb-2" : "-mb-0.5")}>
                        {back && (
                            <button
                                type="button"
                                onClick={back.onClick}
                                className="inline-flex items-center gap-1.5 text-[11px] tracking-[0.2em] uppercase text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                                <ArrowLeft className="size-3" />
                                <span>{back.label ?? "Back"}</span>
                            </button>
                        )}
                        {!back && accent && <span className="h-px w-5 sm:w-6 bg-primary" />}
                        {eyebrow && (
                            <span className="text-[10px] sm:text-[11px] tracking-[0.25em] uppercase text-muted-foreground">
                                {eyebrow}
                            </span>
                        )}
                    </div>
                )}

                <div className="flex items-center gap-2.5 sm:gap-3">
                    {iconNode}
                    {typeof title === "string" ? (
                        <h1 className="text-xl sm:text-2xl lg:text-3xl font-light leading-tight truncate">{title}</h1>
                    ) : (
                        title
                    )}
                    {primaryAction && (
                        <div className="ml-auto shrink-0 flex items-center gap-0.5 sm:gap-1">{primaryAction}</div>
                    )}
                </div>

                {description && (
                    <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">{description}</p>
                )}

                {meta && meta.length > 0 && (
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] sm:text-xs text-muted-foreground">
                        {meta.map((item, i) => (
                            // biome-ignore lint/suspicious/noArrayIndexKey: positional meta list
                            <span key={i} className="inline-flex items-center gap-2">
                                {i > 0 && <span className="text-border">·</span>}
                                {item}
                            </span>
                        ))}
                    </div>
                )}
            </div>
            {divider && <div className="h-px bg-border/50" />}
        </div>
    );
}
