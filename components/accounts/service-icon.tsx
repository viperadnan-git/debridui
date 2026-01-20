import { AccountType } from "@/lib/types";
import { User } from "lucide-react";
import Image from "next/image";

const SERVICE_ICONS: Record<AccountType, string> = {
    [AccountType.TORBOX]: "https://i.ibb.co/xqNBTPG1/68747470733a2f2f746f72626f782e6170702f6c6f676f2e706e67.png",
    [AccountType.ALLDEBRID]: "https://i.ibb.co/tTDfYx0v/icon.jpg",
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
