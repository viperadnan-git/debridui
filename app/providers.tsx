"use client";

import { ProgressProvider } from "@bprogress/next/app";
import { Toaster } from "sonner";
import { QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { useState, useEffect } from "react";
import {
    queryClient,
    initializeQueryClientPersistence,
} from "@/lib/query-client";

const Providers = ({ children }: { children: React.ReactNode }) => {
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
        initializeQueryClientPersistence();
    }, []);

    if (!isClient) {
        return null; // Prevent SSR hydration mismatch
    }

    return (
        <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange>
            <ProgressProvider
                height="4px"
                color="var(--foreground)"
                options={{ showSpinner: false }}
                shallowRouting>
                <QueryClientProvider client={queryClient}>
                    {children}
                </QueryClientProvider>
                <Toaster position="top-right" closeButton />
            </ProgressProvider>
        </ThemeProvider>
    );
};

export default Providers;
