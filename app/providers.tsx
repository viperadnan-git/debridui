"use client";

import { ProgressProvider } from "@bprogress/next/app";
import { Toaster } from "@/components/ui/sonner";
import { QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { useState, useEffect } from "react";
import { queryClient, initializeQueryClientPersistence } from "@/lib/query-client";
import { TooltipProvider } from "@/components/ui/tooltip";
import "@/lib/preview/register-renderers"; // Register preview renderers

const Providers = ({ children }: { children: React.ReactNode }) => {
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsClient(true);
        initializeQueryClientPersistence();
    }, []);

    if (!isClient) {
        return null; // Prevent SSR hydration mismatch
    }

    return (
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
            <ProgressProvider height="4px" color="var(--primary)" options={{ showSpinner: false }} shallowRouting>
                <QueryClientProvider client={queryClient}>
                    <TooltipProvider delayDuration={2000}>{children}</TooltipProvider>
                </QueryClientProvider>
                <Toaster position="top-right" closeButton richColors />
            </ProgressProvider>
        </ThemeProvider>
    );
};

export default Providers;
