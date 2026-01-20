"use client";

import { FileExplorer } from "@/components/explorer/file-explorer";
import { useAuthContext } from "@/lib/contexts/auth";

export default function AccountPage() {
    const { currentUser } = useAuthContext();
    return <FileExplorer key={currentUser.id} />;
}
