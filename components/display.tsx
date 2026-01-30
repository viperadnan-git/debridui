import { AccountType, DebridFileStatus, WebDownloadStatus } from "@/lib/types";
import {
    DownloadIcon,
    PauseIcon,
    InfoIcon,
    StoreIcon,
    UploadIcon,
    CircleCheckIcon,
    ClockIcon,
    OctagonAlertIcon,
    CircleXIcon,
    Zap,
} from "lucide-react";
import { memo } from "react";
import { cn } from "@/lib/utils";

export function AccountIcon({ type }: { type: AccountType | string }) {
    switch (type) {
        case AccountType.ALLDEBRID:
            return <StoreIcon />;
    }
}

// Unified color palette for status indicators
// Semantic colors with background, border, and text in one definition
const statusStyles = {
    slate: "bg-slate-500/10 border-slate-500/20 text-slate-600 dark:text-slate-400",
    blue: "bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400",
    emerald: "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400",
    amber: "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400",
    green: "bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400",
    sky: "bg-sky-500/10 border-sky-500/20 text-sky-600 dark:text-sky-400",
    red: "bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400",
    violet: "bg-violet-500/10 border-violet-500/20 text-violet-600 dark:text-violet-400",
    gray: "bg-gray-500/10 border-gray-500/20 text-gray-600 dark:text-gray-400",
} as const;

type StatusColor = keyof typeof statusStyles;

interface StatusConfig {
    icon: typeof ClockIcon;
    color: StatusColor;
    name: string;
}

const statusConfig: Record<DebridFileStatus, StatusConfig> = {
    waiting: { icon: ClockIcon, color: "slate", name: "Waiting" },
    downloading: { icon: DownloadIcon, color: "blue", name: "Downloading" },
    seeding: { icon: UploadIcon, color: "emerald", name: "Seeding" },
    paused: { icon: PauseIcon, color: "amber", name: "Paused" },
    completed: { icon: CircleCheckIcon, color: "green", name: "Completed" },
    uploading: { icon: UploadIcon, color: "sky", name: "Uploading" },
    failed: { icon: OctagonAlertIcon, color: "red", name: "Failed" },
    processing: { icon: ClockIcon, color: "violet", name: "Processing" },
    inactive: { icon: CircleXIcon, color: "gray", name: "Inactive" },
    unknown: { icon: InfoIcon, color: "slate", name: "Unknown" },
};

export const StatusBadge = memo(function StatusBadge({
    status,
    hide,
}: {
    status: DebridFileStatus;
    hide?: DebridFileStatus;
}) {
    const config = statusConfig[status];
    if (!config) return null;
    if (hide && status === hide) return null;

    const Icon = config.icon;

    return (
        <span
            className={cn(
                "inline-flex items-center justify-center gap-1.5 h-6 px-2 border rounded-sm text-xs font-medium shrink-0",
                statusStyles[config.color]
            )}>
            <Icon className="size-3.5 shrink-0" strokeWidth={2.5} />
            <span className="hidden sm:inline tracking-wide">{config.name}</span>
        </span>
    );
});

export const CachedBadge = memo(function CachedBadge() {
    return (
        <span className="inline-flex items-center gap-1 text-xs tracking-wide text-green-600 dark:text-green-500">
            <Zap className="size-3" />
            <span>Cached</span>
        </span>
    );
});

interface WebStatusConfig {
    icon: typeof ClockIcon;
    label: string;
    color: StatusColor;
}

const webDownloadStatusConfig: Record<WebDownloadStatus, WebStatusConfig> = {
    pending: { icon: ClockIcon, label: "Pending", color: "slate" },
    processing: { icon: DownloadIcon, label: "Processing", color: "blue" },
    completed: { icon: CircleCheckIcon, label: "Ready", color: "green" },
    cached: { icon: Zap, label: "Cached", color: "emerald" },
    failed: { icon: OctagonAlertIcon, label: "Failed", color: "red" },
};

export const WebDownloadStatusBadge = memo(function WebDownloadStatusBadge({
    status,
    className,
}: {
    status: WebDownloadStatus;
    className?: string;
}) {
    const config = webDownloadStatusConfig[status];
    const Icon = config.icon;

    return (
        <span
            className={cn(
                "inline-flex items-center justify-center gap-1.5 h-6 px-2 border rounded-sm text-xs font-medium shrink-0",
                statusStyles[config.color],
                className
            )}>
            <Icon className="size-3.5 shrink-0" strokeWidth={2.5} />
            <span className="hidden sm:inline tracking-wide">{config.label}</span>
        </span>
    );
});
