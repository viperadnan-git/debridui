import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";
import localFont from "next/font/local";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
    title: "Debrid UI",
    description:
        "Supercharge your debrid experience with Debrid UI. Multi-client support and lots of features.",
};

const font = localFont({
    src: [
        {
            path: "../public/fonts/Styrene-B-Regular.woff2",
            style: "normal",
            weight: "400",
        },
        {
            path: "../public/fonts/Styrene-B-Bold.woff2",
            weight: "700",
            style: "normal",
        },
    ],
    variable: "--font-sans",
    display: "swap",
});

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={cn(font.className, "antialiased")}>
                <Providers>{children}</Providers>
            </body>
        </html>
    );
}
