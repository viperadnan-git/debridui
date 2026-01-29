import { AccountType } from "@/lib/types";
import { ACCOUNT_TYPE_ICONS } from "@/lib/constants";
import { User } from "lucide-react";
import Image from "next/image";

interface ServiceIconProps {
    type: AccountType;
    className?: string;
}

export function ServiceIcon({ type, className = "h-5 w-5" }: ServiceIconProps) {
    const iconUrl = ACCOUNT_TYPE_ICONS[type];

    if (!iconUrl) {
        return <User className={className} />;
    }

    return <Image src={iconUrl} alt={type} width={20} height={20} className={className} unoptimized />;
}
