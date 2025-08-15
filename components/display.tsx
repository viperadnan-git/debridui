import { DebridFileStatus } from "@/lib/clients/types";
import { AccountType } from "@/lib/types";
import {
    DownloadIcon,
    PauseIcon,
    InfoIcon,
    StoreIcon,
    UploadIcon,
    CircleCheckIcon,
    ClockIcon,
    OctagonAlertIcon,
} from "lucide-react";
import { Badge } from "./ui/badge";
import { cache } from "react";
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
                color: "bg-gray-500/80 text-primary-foreground",
                name: "Waiting",
            };
        case "downloading":
            return {
                icon: DownloadIcon,
                color: "bg-blue-500/80 text-primary-foreground",
                name: "Downloading",
            };
        case "seeding":
            return {
                icon: UploadIcon,
                color: "bg-green-500/80 text-primary-foreground",
                name: "Seeding",
            };
        case "paused":
            return {
                icon: PauseIcon,
                color: "bg-yellow-500/80 text-primary-foreground",
                name: "Paused",
            };
        case "completed":
            return {
                icon: CircleCheckIcon,
                color: "bg-green-500/80 text-primary-foreground",
                name: "Completed",
            };
        case "uploading":
            return {
                icon: UploadIcon,
                color: "bg-blue-500/80 text-primary-foreground",
                name: "Uploading",
            };
        case "failed":
            return {
                icon: OctagonAlertIcon,
                color: "bg-red-500/80 text-primary-foreground",
                name: "Failed",
            };
        case "unknown":
            return {
                icon: InfoIcon,
                color: "bg-gray-500/80 text-primary-foreground",
                name: "Unknown",
            };
    }
});

export function StatusBadge({
    status,
    hide,
}: {
    status: DebridFileStatus;
    hide?: DebridFileStatus;
}) {
    const config = getStatusConfig(status);
    if (!config) return null;
    if (hide && status === hide) return null;
    const Icon = config.icon;

    return (
        <Badge
            variant="outline"
            className={cn(
                "px-1 md:px-1.5 py-0.2 border-0 rounded-sm text-xs md:text-sm",
                config.color
            )}
        >
            <Icon className="size-3" />
            {config.name}
        </Badge>
    );
}
