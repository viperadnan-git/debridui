"use client";

import { ProgressProvider } from "@bprogress/next/app";
import { Toaster } from "@/components/ui/sonner";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { ThemeProvider } from "next-themes";
import { queryClient, persistOptions } from "@/lib/query-client";
import { TooltipProvider } from "@/components/ui/tooltip";
import "@/lib/preview/register-renderers"; // Register preview renderers

const Providers = ({ children }: { children: React.ReactNode }) => {
    return (
        <ThemeProvider attribute="class" defaultTheme="dark">
            <ProgressProvider height="4px" color="var(--primary)" options={{ showSpinner: false }} shallowRouting>
                <PersistQueryClientProvider client={queryClient} persistOptions={persistOptions}>
                    <TooltipProvider delayDuration={2000}>{children}</TooltipProvider>
                </PersistQueryClientProvider>
                <Toaster position="top-right" closeButton richColors />
            </ProgressProvider>
        </ThemeProvider>
    );
};

export default Providers;
