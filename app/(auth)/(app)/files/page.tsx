"use client";

import { Suspense } from "react";
import { useAuthGuaranteed } from "@/components/auth/auth-provider";
import { FileExplorer } from "@/components/explorer/file-explorer";

export default function AccountPage() {
    const { currentAccount } = useAuthGuaranteed();
    return (
        <Suspense fallback={null}>
            <FileExplorer key={currentAccount.id} />
        </Suspense>
    );
}
