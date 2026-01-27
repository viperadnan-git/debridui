"use client";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { SectionDivider } from "@/components/section-divider";
import { RefreshCw, Link2 } from "lucide-react";
import { WebDownloadsProvider, useWebDownloads } from "@/components/web-downloads/web-downloads-provider";
import { AddLinksForm } from "@/components/web-downloads/add-links-form";
import { DownloadList } from "@/components/web-downloads/download-list";

function LinksContent() {
    const { refetch, isRefetching, isLoading } = useWebDownloads();

    return (
        <div className="mx-auto w-full max-w-4xl space-y-8 pb-16">
            <PageHeader
                icon={Link2}
                title="Links"
                description="Unlock and download files from supported hosters"
                action={
                    <Button onClick={() => refetch()} disabled={isRefetching || isLoading} variant="outline">
                        <RefreshCw className={`size-4 ${isRefetching ? "animate-spin" : ""}`} />
                        Refresh
                    </Button>
                }
            />

            <section className="space-y-4">
                <SectionDivider label="Add Links" />
                <AddLinksForm />
            </section>

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
