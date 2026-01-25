"use client";

import { FileExplorer } from "@/components/explorer/file-explorer";
import { useAuthGuaranteed } from "@/components/auth/auth-provider";

export default function AccountPage() {
    const { currentUser } = useAuthGuaranteed();
    return <FileExplorer key={currentUser.id} />;
}
