"use client";

import {
    SidebarProvider,
    SidebarInset,
    SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/sidebar";
import { SearchProvider } from "@/components/mdb/search-provider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { AuthContext } from "@/lib/contexts/auth";
import { useUserStore } from "@/lib/stores/users";

export default function Layout({ children }: { children: React.ReactNode }) {
    const { isHydrated, currentUser, client } = useUserStore();
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
                        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
                            <div className="flex items-center gap-2 px-4 z-50">
                                <SidebarTrigger className="-ml-1" />
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
