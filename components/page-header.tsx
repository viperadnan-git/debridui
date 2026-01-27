import type { LucideIcon } from "lucide-react";

interface PageHeaderProps {
    icon?: LucideIcon;
    title: string;
    description: string;
    action?: React.ReactNode;
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-2xl sm:text-3xl font-light">{title}</h1>
                    <p className="text-sm text-muted-foreground">{description}</p>
                </div>
                {action && <div className="shrink-0">{action}</div>}
            </div>
            <div className="h-px bg-border/50" />
        </div>
    );
}
