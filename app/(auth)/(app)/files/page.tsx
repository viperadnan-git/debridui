"use client";

import { useAuthGuaranteed } from "@/components/auth/auth-provider";
import { FileExplorer } from "@/components/explorer/file-explorer";

export default function AccountPage() {
    const { currentAccount } = useAuthGuaranteed();
    return <FileExplorer key={currentAccount.id} />;
}
