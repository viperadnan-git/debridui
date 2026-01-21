import { AccountType } from "@/lib/types";
import { User } from "lucide-react";
import Image from "next/image";

const SERVICE_ICONS: Record<AccountType, string> = {
    [AccountType.TORBOX]: "https://wsrv.nl/?url=https://i.ibb.co/YgB6zFK/icon.png&w=280&h=280&maxage=1y",
    [AccountType.ALLDEBRID]: "https://wsrv.nl/?url=https://i.ibb.co/tTDfYx0v/icon.jpg&w=280&h=280&maxage=1y",
};

interface ServiceIconProps {
    type: AccountType;
    className?: string;
}

export function ServiceIcon({ type, className = "h-5 w-5" }: ServiceIconProps) {
    const iconUrl = SERVICE_ICONS[type];

    if (!iconUrl) {
        return <User className={className} />;
    }

    return <Image src={iconUrl} alt={type} width={20} height={20} className={className} unoptimized />;
}
