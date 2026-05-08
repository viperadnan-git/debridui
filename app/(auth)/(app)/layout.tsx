"use client";

import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { SearchButton } from "@/components/common/search-button";
import { SearchProvider } from "@/components/mdb/search-provider";
import { PreviewDialog } from "@/components/preview/preview-dialog";
import { useAuth } from "@/components/auth/auth-provider";
import { SplashScreen } from "@/components/splash-screen";
import { BottomTabBar } from "@/components/mobile/bottom-tab-bar";
import { AccountQuickSwitch } from "@/components/mobile/account-quick-switch";
import Image from "next/image";
import Link from "next/link";

// App layout - requires at least one account
// Redirect logic is centralized in AuthProvider
export default function AppLayout({ children }: { children: React.ReactNode }) {
    const { userAccounts, currentAccount, client } = useAuth();

    // Single check for all required data to prevent flicker
    // AuthProvider handles redirect to /onboarding if no accounts
    const isReady = userAccounts.length > 0 && currentAccount && client;
    if (!isReady) {
        return <SplashScreen />;
    }

    return (
        <SearchProvider>
            <SidebarProvider>
                <AppSidebar />
                <SidebarInset className="overflow-x-hidden">
                    <header className="sticky top-0 z-50 shrink-0 pt-safe bg-background border-b border-border/30">
                        <div className="flex h-12 items-center justify-between gap-4 px-4">
                            <div className="flex items-center gap-2 min-w-0 overflow-hidden">
                                <SidebarTrigger className="-ml-1 shrink-0 hidden md:inline-flex" />
                                <Link
                                    href="/dashboard"
                                    aria-label="DebridUI home"
                                    className="md:hidden flex items-center -ml-1 px-2 h-9 rounded-sm hover:bg-muted/40 active:bg-muted/50 transition-colors">
                                    <Image
                                        src="/logo.svg"
                                        alt="DebridUI"
                                        width={88}
                                        height={20}
                                        priority
                                        className="h-4 w-auto dark:invert"
                                    />
                                </Link>
                                <div className="hidden md:flex min-w-0">
                                    <Breadcrumbs />
                                </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                                <SearchButton className="hidden md:inline-flex" />
                                <div className="md:hidden">
                                    <AccountQuickSwitch />
                                </div>
                            </div>
                        </div>
                    </header>
                    <div className="flex flex-1 flex-col gap-4 p-4 pt-6 pb-mobile-tabbar md:pb-4">{children}</div>
                </SidebarInset>
                <BottomTabBar />
            </SidebarProvider>
            <PreviewDialog />
        </SearchProvider>
    );
}
