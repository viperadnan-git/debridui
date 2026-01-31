"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { SearchProvider } from "@/components/mdb/search-provider";
import { FilePreviewDialog } from "@/components/preview/file-preview-dialog";
import { useAuth } from "@/components/auth/auth-provider";
import { SplashScreen } from "@/components/splash-screen";

// App layout - requires at least one account
// Uses AuthProvider from parent (auth) layout
export default function AppLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const { userAccounts, currentAccount, currentUser, client } = useAuth();

    const hasAccounts = userAccounts.length > 0;

    // Redirect to onboarding if no accounts
    useEffect(() => {
        if (!hasAccounts) {
            router.push("/onboarding");
        }
    }, [hasAccounts, router]);

    // Single check for all required data to prevent flicker
    const isReady = hasAccounts && currentAccount && currentUser && client;
    if (!isReady) {
        return <SplashScreen />;
    }

    return (
        <SearchProvider>
            <SidebarProvider>
                <AppSidebar />
                <SidebarInset className="overflow-x-hidden">
                    <header className="flex h-12 shrink-0 z-50 items-center gap-2 border-b border-border/30 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
                        <div className="flex items-center gap-2 px-4">
                            <SidebarTrigger className="-ml-1" />
                            <Breadcrumbs />
                        </div>
                    </header>
                    <div className="flex flex-1 flex-col gap-4 p-4 pt-6">{children}</div>
                </SidebarInset>
            </SidebarProvider>
            <FilePreviewDialog />
        </SearchProvider>
    );
}
