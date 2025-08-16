"use client";

import {
    SidebarProvider,
    SidebarInset,
    SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { AppSidebar } from "@/components/sidebar";
import { useAuth, useClient } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { AuthContext } from "@/lib/contexts/auth";

export default function Layout({ children }: { children: React.ReactNode }) {
    const { currentUser, isReady } = useAuth();
    const client = useClient();
    const router = useRouter();

    useEffect(() => {
        if (isReady && !currentUser) {
            router.push("/login");
        }
    }, [currentUser, isReady, router]);

    if (!isReady) {
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
            <SidebarProvider>
                <AppSidebar />
                <SidebarInset>
                    <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
                        <div className="flex items-center gap-2 px-4">
                            <SidebarTrigger className="-ml-1" />
                            <Separator
                                orientation="vertical"
                                className="mr-2 data-[orientation=vertical]:h-4"
                            />
                        </div>
                    </header>
                    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
                        {children}
                    </div>
                </SidebarInset>
            </SidebarProvider>
        </AuthContext.Provider>
    );
}
