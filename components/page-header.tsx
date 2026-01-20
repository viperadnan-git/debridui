import type { LucideIcon } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface PageHeaderProps {
    icon: LucideIcon;
    title: string;
    description: string;
    action?: React.ReactNode;
}

export function PageHeader({ icon: Icon, title, description, action }: PageHeaderProps) {
    return (
        <>
            <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                        <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                            <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight truncate">{title}</h1>
                            <p className="text-sm sm:text-base text-muted-foreground truncate">{description}</p>
                        </div>
                    </div>
                    {action && <div className="shrink-0">{action}</div>}
                </div>
            </div>

            <Separator />
        </>
    );
}
