"use client";

import {
    SidebarProvider,
    SidebarInset,
    SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/sidebar";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { SearchProvider } from "@/components/mdb/search-provider";
import { useRouter } from "@bprogress/next/app";
import { useEffect } from "react";
import { AuthContext } from "@/lib/contexts/auth";
import { useUserStore } from "@/lib/stores/users";
import { useShallow } from "zustand/react/shallow";
import { Separator } from "@/components/ui/separator";

export default function Layout({ children }: { children: React.ReactNode }) {
    const { isHydrated, currentUser, client } = useUserStore(
        useShallow((state) => ({
            isHydrated: state.isHydrated,
            currentUser: state.currentUser,
            client: state.client,
        }))
    );
    const router = useRouter();

    useEffect(() => {
        if (isHydrated && !currentUser) {
            router.push("/login");
        }
    }, [currentUser, isHydrated, router]);

    if (!isHydrated) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="animate-pulse text-muted-foreground">
                    Loading...
                </div>
            </div>
        );
    }

    if (!currentUser || !client) {
        return null;
    }

    return (
        <AuthContext.Provider value={{ currentUser, client }}>
            <SearchProvider>
                <SidebarProvider>
                    <AppSidebar />
                    <SidebarInset className="overflow-x-hidden">
                        <header className="flex h-16 shrink-0 z-50 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
                            <div className="flex items-center gap-2 px-4">
                                <SidebarTrigger className="-ml-1" />
                                <Separator
                                    orientation="vertical"
                                    className="mr-2 data-[orientation=vertical]:h-4"
                                />
                                <Breadcrumbs />
                            </div>
                        </header>
                        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
                            {children}
                        </div>
                    </SidebarInset>
                </SidebarProvider>
            </SearchProvider>
        </AuthContext.Provider>
    );
}
