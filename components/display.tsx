import { AccountType, DebridFileStatus } from "@/lib/types";
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
import { Badge } from "./ui/badge";
import { cache, memo } from "react";
import { cn } from "@/lib/utils";

export function AccountIcon({ type }: { type: AccountType | string }) {
    switch (type) {
        case AccountType.ALLDEBRID:
            return <StoreIcon />;
    }
}

const getStatusConfig = cache((status: DebridFileStatus) => {
    switch (status) {
        case "waiting":
            return {
                icon: ClockIcon,
                color: "bg-slate-600/10 text-slate-600 border-slate-600/20 dark:bg-slate-400/10 dark:text-slate-400 dark:border-slate-400/20",
                name: "Waiting",
            };
        case "downloading":
            return {
                icon: DownloadIcon,
                color: "bg-blue-600/10 text-blue-600 border-blue-600/20 dark:bg-blue-400/10 dark:text-blue-400 dark:border-blue-400/20",
                name: "Downloading",
                animate: true,
            };
        case "seeding":
            return {
                icon: UploadIcon,
                color: "bg-emerald-600/10 text-emerald-600 border-emerald-600/20 dark:bg-emerald-400/10 dark:text-emerald-400 dark:border-emerald-400/20",
                name: "Seeding",
            };
        case "paused":
            return {
                icon: PauseIcon,
                color: "bg-amber-600/10 text-amber-600 border-amber-600/20 dark:bg-amber-400/10 dark:text-amber-400 dark:border-amber-400/20",
                name: "Paused",
            };
        case "completed":
            return {
                icon: CircleCheckIcon,
                color: "bg-green-600/10 text-green-600 border-green-600/20 dark:bg-green-400/10 dark:text-green-400 dark:border-green-400/20",
                name: "Completed",
            };
        case "uploading":
            return {
                icon: UploadIcon,
                color: "bg-sky-600/10 text-sky-600 border-sky-600/20 dark:bg-sky-400/10 dark:text-sky-400 dark:border-sky-400/20",
                name: "Uploading",
                animate: true,
            };
        case "failed":
            return {
                icon: OctagonAlertIcon,
                color: "bg-red-600/10 text-red-600 border-red-600/20 dark:bg-red-400/10 dark:text-red-400 dark:border-red-400/20",
                name: "Failed",
            };
        case "processing":
            return {
                icon: ClockIcon,
                color: "bg-violet-600/10 text-violet-600 border-violet-600/20 dark:bg-violet-400/10 dark:text-violet-400 dark:border-violet-400/20",
                name: "Processing",
                animate: true,
            };
        case "inactive":
            return {
                icon: CircleXIcon,
                color: "bg-gray-600/10 text-gray-600 border-gray-600/20 dark:bg-gray-400/10 dark:text-gray-400 dark:border-gray-400/20",
                name: "Inactive",
            };
        case "unknown":
            return {
                icon: InfoIcon,
                color: "bg-slate-600/10 text-slate-600 border-slate-600/20 dark:bg-slate-400/10 dark:text-slate-400 dark:border-slate-400/20",
                name: "Unknown",
            };
    }
});

export function StatusBadge({ status, hide }: { status: DebridFileStatus; hide?: DebridFileStatus }) {
    const config = getStatusConfig(status);
    if (!config) return null;
    if (hide && status === hide) return null;
    const Icon = config.icon;

    return (
        <Badge
            className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-1 md:gap-1.5 rounded-xl text-xs font-medium focus-visible:outline-none",
                config.color,
                config.animate && "animate-pulse"
            )}>
            <Icon className="size-3.5" strokeWidth={2.5} />
            <span className="hidden md:inline leading-none">{config.name}</span>
        </Badge>
    );
}

export const CachedBadge = memo(function CachedBadge() {
    return (
        <span className="inline-flex items-center gap-1 text-[10px] tracking-wide text-green-600 dark:text-green-500">
            <Zap className="size-2.5" />
            <span>Cached</span>
        </span>
    );
});
