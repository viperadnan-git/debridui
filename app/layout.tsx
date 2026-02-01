import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";
import { cn } from "@/lib/utils";
import { Analytics } from "@/components/analytics";

const siteConfig = {
    name: "DebridUI",
    description: "A modern debrid client with integrated media discovery and streaming.",
    url: "https://debridui.viperadnan.com",
    ogImage: "/banner.jpg",
    keywords: [
        "debrid",
        "debrid ui",
        "debrid client",
        "real debrid",
        "torbox",
        "alldebrid",
        "file manager",
        "media streaming",
        "download manager",
        "trakt",
        "media discovery",
    ],
};

export const metadata: Metadata = {
    metadataBase: new URL(siteConfig.url),
    alternates: {
        canonical: "/",
    },
    title: {
        default: siteConfig.name,
        template: `%s | ${siteConfig.name}`,
    },
    description: siteConfig.description,
    keywords: siteConfig.keywords,
    authors: [{ name: "Adnan Ahmad", url: "https://viperadnan.com" }],
    creator: "Adnan Ahmad",
    openGraph: {
        type: "website",
        locale: "en_US",
        url: siteConfig.url,
        title: siteConfig.name,
        description: siteConfig.description,
        siteName: siteConfig.name,
        images: [
            {
                url: siteConfig.ogImage,
                width: 1200,
                height: 630,
                alt: siteConfig.name,
            },
        ],
    },
    twitter: {
        card: "summary_large_image",
        title: siteConfig.name,
        description: siteConfig.description,
        images: [siteConfig.ogImage],
        creator: "@viperadn",
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            "max-video-preview": -1,
            "max-image-preview": "large",
            "max-snippet": -1,
        },
    },
    icons: {
        icon: "/icon.svg",
        apple: "/icon.svg",
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={cn("font-sans antialiased")}>
                <Providers>{children}</Providers>
                <Analytics />
            </body>
        </html>
    );
}
