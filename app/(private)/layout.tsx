"use client";

import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { SearchProvider } from "@/components/mdb/search-provider";
import { useRouter } from "@bprogress/next/app";
import { AuthContext } from "@/lib/contexts/auth";
import { useUserStore } from "@/lib/stores/users";
import { Separator } from "@/components/ui/separator";
import { useEffect, useMemo } from "react";
import { FilePreviewDialog } from "@/components/preview/file-preview-dialog";
import { getClientInstance } from "@/lib/clients";

export default function Layout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const isHydrated = useUserStore((state) => state.isHydrated);
    const currentUser = useUserStore((state) => state.currentUser);

    useEffect(() => {
        if (isHydrated && !currentUser) {
            router.push("/login");
        }
    }, [isHydrated, currentUser, router]);

    // Memoize context value with client
    const authContextValue = useMemo(() => {
        if (!currentUser) return null;
        return { currentUser, client: getClientInstance(currentUser) };
    }, [currentUser]);

    if (!authContextValue) {
        return null;
    }

    return (
        <AuthContext.Provider value={authContextValue}>
            <SearchProvider>
                <SidebarProvider>
                    <AppSidebar />
                    <SidebarInset className="overflow-x-hidden">
                        <header className="flex h-16 shrink-0 z-50 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
                            <div className="flex items-center gap-2 px-4">
                                <SidebarTrigger className="-ml-1" />
                                <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
                                <Breadcrumbs />
                            </div>
                        </header>
                        <div className="flex flex-1 flex-col gap-4 p-4 pt-6">{children}</div>
                    </SidebarInset>
                </SidebarProvider>
            </SearchProvider>
            <FilePreviewDialog />
        </AuthContext.Provider>
    );
}
