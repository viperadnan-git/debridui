"use client";

import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { SearchButton } from "@/components/common/search-button";
import { SearchProvider } from "@/components/mdb/search-provider";
import { PreviewDialog } from "@/components/preview/preview-dialog";
import { useAuth } from "@/components/auth/auth-provider";
import { SplashScreen } from "@/components/splash-screen";

// App layout - requires at least one account
// Redirect logic is centralized in AuthProvider
export default function AppLayout({ children }: { children: React.ReactNode }) {
    const { userAccounts, currentAccount, currentUser, client } = useAuth();

    // Single check for all required data to prevent flicker
    // AuthProvider handles redirect to /onboarding if no accounts
    const isReady = userAccounts.length > 0 && currentAccount && currentUser && client;
    if (!isReady) {
        return <SplashScreen />;
    }

    return (
        <SearchProvider>
            <SidebarProvider>
                <AppSidebar />
                <SidebarInset className="overflow-x-hidden">
                    <header className="flex h-12 shrink-0 z-50 items-center justify-between gap-4 border-b border-border/30 px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
                        <div className="flex items-center gap-2 min-w-0 overflow-hidden">
                            <SidebarTrigger className="-ml-1 shrink-0" />
                            <Breadcrumbs />
                        </div>
                        <SearchButton className="shrink-0" />
                    </header>
                    <div className="flex flex-1 flex-col gap-4 p-4 pt-6">{children}</div>
                </SidebarInset>
            </SidebarProvider>
            <PreviewDialog />
        </SearchProvider>
    );
}
