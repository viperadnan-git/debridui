"use client";

import { Link2, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { SectionDivider } from "@/components/section-divider";
import { Button } from "@/components/ui/button";
import { AddLinksForm } from "@/components/web-downloads/add-links-form";
import { DownloadList } from "@/components/web-downloads/download-list";
import { useWebDownloads, WebDownloadsProvider } from "@/components/web-downloads/web-downloads-provider";

function LinksContent() {
    const { refetch, isRefetching, isLoading } = useWebDownloads();

    return (
        <div className="mx-auto w-full max-w-4xl space-y-4 sm:space-y-6 lg:space-y-8 pb-16">
            <PageHeader
                icon={Link2}
                title="Links"
                description="Unlock and download files from supported hosters"
                primaryAction={
                    <Button
                        onClick={() => refetch()}
                        disabled={isRefetching || isLoading}
                        variant="ghost"
                        size="icon"
                        aria-label="Refresh"
                        className="size-8 sm:size-9 -mr-1.5 text-muted-foreground hover:text-foreground">
                        <RefreshCw className={`size-5 sm:size-[22px] ${isRefetching ? "animate-spin" : ""}`} />
                    </Button>
                }
            />

            <AddLinksForm />

            <section className="space-y-4">
                <SectionDivider label="Downloads" />
                <DownloadList />
            </section>
        </div>
    );
}

export default function LinksPage() {
    return (
        <WebDownloadsProvider>
            <LinksContent />
        </WebDownloadsProvider>
    );
}
