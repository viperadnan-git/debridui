import Image from "next/image";
import Link from "next/link";
import { ArrowRightIcon, ArrowUpRightIcon, ChevronDownIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Gallery } from "@/components/gallery";
import { DISCORD_URL, ACCOUNT_TYPE_LABELS, ACCOUNT_TYPE_ICONS, EXTENSION_TO_FILE_TYPE } from "@/lib/constants";
import { AccountType, MediaPlayer } from "@/lib/types";

const screenshots = [
    {
        id: "dashboard",
        label: "Dashboard",
        src: {
            default: "https://res.cloudinary.com/viperadnan/image/upload/v1769483514/debridui-mockup-1.jpg",
            mobile: "https://res.cloudinary.com/viperadnan/image/upload/v1769483514/debridui-mockup-mobile-1.jpg",
        },
    },
    {
        id: "explorer",
        label: "Explorer",
        src: {
            default: "https://res.cloudinary.com/viperadnan/image/upload/v1769483514/debridui-mockup-2.jpg",
            mobile: "https://res.cloudinary.com/viperadnan/image/upload/v1769483514/debridui-mockup-mobile-2.jpg",
        },
    },
    {
        id: "media",
        label: "Media",
        src: {
            default: "https://res.cloudinary.com/viperadnan/image/upload/v1769483514/debridui-mockup-3.jpg",
            mobile: "https://res.cloudinary.com/viperadnan/image/upload/v1769483514/debridui-mockup-mobile-3.jpg",
        },
    },
    {
        id: "search",
        label: "Search",
        src: {
            default: "https://res.cloudinary.com/viperadnan/image/upload/v1769483514/debridui-mockup-4.jpg",
            mobile: "https://res.cloudinary.com/viperadnan/image/upload/v1769483514/debridui-mockup-mobile-4.jpg",
        },
    },
    {
        id: "addons",
        label: "Addons",
        src: {
            default: "https://res.cloudinary.com/viperadnan/image/upload/v1769483514/debridui-mockup-5.jpg",
            mobile: "https://res.cloudinary.com/viperadnan/image/upload/v1769483514/debridui-mockup-mobile-5.jpg",
        },
    },
];

const capabilities = [
    {
        num: "01",
        title: "Manage",
        desc: "Multi-account file management with tree view, batch operations, and drag & drop uploads.",
    },
    { num: "02", title: "Discover", desc: "Stremio addons, cross-source search with ratings and trailers." },
    { num: "03", title: "Stream", desc: "Play to VLC, Kodi, MPV, and 6 more players. Track progress across devices." },
];

const highlights = [
    {
        value: String(Object.keys(ACCOUNT_TYPE_LABELS).length),
        label: "Providers",
        detail: Object.values(ACCOUNT_TYPE_LABELS).join(", "),
    },
    {
        value: `${Object.keys(EXTENSION_TO_FILE_TYPE).length}+`,
        label: "File previews",
        detail: "Video, audio, images, documents, and more",
    },
    {
        value: String(Object.values(MediaPlayer).length),
        label: "External players",
        detail:
            Object.values(MediaPlayer).length > 8
                ? `${Object.values(MediaPlayer).slice(0, 8).join(", ")}, and more`
                : Object.values(MediaPlayer).join(", "),
    },
    { value: "100%", label: "Open source", detail: "GPL-3.0 licensed, community-driven" },
];

const techStack = [
    { name: "Next.js", icon: "nextdotjs" },
    { name: "TypeScript", icon: "typescript" },
    { name: "Tailwind", icon: "tailwindcss" },
    { name: "PostgreSQL", icon: "postgresql" },
];

export default function Home() {
    return (
        <div className="min-h-screen">
            {/* ─── HERO ─── */}
            <section className="relative min-h-svh flex flex-col overflow-hidden">
                {/* Background decorative elements */}
                <div className="absolute inset-0 pointer-events-none">
                    {/* Subtle radial glow */}
                    <div className="absolute top-[10%] right-[5%] w-[50%] h-[60%] bg-[radial-gradient(ellipse_at_center,var(--primary)_0%,transparent_70%)] opacity-[0.03]" />
                    <div className="absolute bottom-[5%] left-[10%] w-[35%] h-[40%] bg-[radial-gradient(ellipse_at_center,var(--secondary)_0%,transparent_70%)] opacity-[0.025]" />
                    {/* Decorative vertical rules */}
                    <div className="hidden lg:block absolute top-0 bottom-0 left-[calc(50%-1px)] w-px bg-border/20" />
                    <div className="hidden xl:block absolute top-0 bottom-0 left-[25%] w-px bg-border/10" />
                    <div className="hidden xl:block absolute top-0 bottom-0 right-[25%] w-px bg-border/10" />
                    {/* Horizontal rule accent */}
                    <div className="absolute top-[38%] left-0 right-0 h-px bg-border/15 hidden md:block" />
                </div>

                {/* ── Navigation bar ── */}
                <nav
                    className="relative z-10 px-6 py-5 md:px-12 lg:px-20 flex items-center justify-between animate-in fade-in-0"
                    style={{ animationDuration: "600ms" }}>
                    <div
                        className="animate-in fade-in-0 slide-in-from-left-4"
                        style={{ animationDuration: "600ms", animationDelay: "100ms", animationFillMode: "backwards" }}>
                        <Image
                            className="dark:invert h-4 sm:h-5 w-auto"
                            src="/logo.svg"
                            alt="DebridUI"
                            width={100}
                            height={32}
                            priority
                        />
                    </div>
                    <div
                        className="flex items-center gap-3 sm:gap-5 animate-in fade-in-0 slide-in-from-right-4"
                        style={{ animationDuration: "600ms", animationDelay: "100ms", animationFillMode: "backwards" }}>
                        <Link
                            href="https://github.com/viperadnan-git/debridui"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors">
                            GitHub
                            <ArrowUpRightIcon className="inline size-2.5 ml-0.5 opacity-40" />
                        </Link>
                        {DISCORD_URL && (
                            <Link
                                href={DISCORD_URL}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[10px] tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors">
                                Discord
                            </Link>
                        )}
                    </div>
                </nav>

                {/* ── Main hero content ── */}
                <div className="relative z-10 flex-1 flex flex-col justify-center px-6 md:px-12 lg:px-20 py-12 md:py-16">
                    <div className="max-w-7xl mx-auto w-full">
                        {/* Eyebrow label */}
                        <div
                            className="flex items-center gap-3 mb-8 md:mb-12 animate-in fade-in-0"
                            style={{
                                animationDuration: "500ms",
                                animationDelay: "200ms",
                                animationFillMode: "backwards",
                            }}>
                            <div className="size-1.5 bg-primary" />
                            <span className="text-[10px] tracking-widest uppercase text-muted-foreground">
                                Open Source Debrid Client
                            </span>
                        </div>

                        {/* Headline — massive typography with staggered reveal */}
                        <div className="mb-10 md:mb-14">
                            <div
                                className="overflow-hidden animate-in fade-in-0 slide-in-from-bottom-8"
                                style={{
                                    animationDuration: "700ms",
                                    animationDelay: "300ms",
                                    animationFillMode: "backwards",
                                }}>
                                <h1 className="text-[clamp(2rem,7vw,5.5rem)] font-light leading-none tracking-tight">
                                    <span className="text-muted-foreground/60">Your media,</span>
                                </h1>
                            </div>
                            <div
                                className="overflow-hidden animate-in fade-in-0 slide-in-from-bottom-8"
                                style={{
                                    animationDuration: "700ms",
                                    animationDelay: "420ms",
                                    animationFillMode: "backwards",
                                }}>
                                <h1 className="text-[clamp(2rem,7vw,5.5rem)] font-light leading-none tracking-tight">
                                    <span className="text-foreground">one interface</span>
                                    <span className="text-primary">.</span>
                                </h1>
                            </div>
                        </div>

                        {/* Subheadline + CTA — side by side on desktop */}
                        <div className="grid lg:grid-cols-[1fr_auto] gap-8 lg:gap-16 items-end">
                            <div
                                className="max-w-md animate-in fade-in-0 slide-in-from-bottom-6"
                                style={{
                                    animationDuration: "600ms",
                                    animationDelay: "550ms",
                                    animationFillMode: "backwards",
                                }}>
                                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-6">
                                    Manage files, discover content, and stream to any player — with stremio addons
                                    support.
                                </p>
                                <div className="flex flex-wrap items-center gap-3">
                                    <Button asChild size="lg" className="h-10 px-6 tracking-wide">
                                        <Link href="/dashboard">
                                            Get Started
                                            <ArrowRightIcon className="size-4 ml-2" />
                                        </Link>
                                    </Button>
                                    <Button asChild variant="outline" size="lg" className="h-10 px-5 tracking-wide">
                                        <Link
                                            href="https://github.com/viperadnan-git/debridui"
                                            target="_blank"
                                            rel="noopener noreferrer">
                                            <img
                                                src="https://cdn.jsdelivr.net/npm/simple-icons@v14/icons/github.svg"
                                                alt="GitHub logo"
                                                width={14}
                                                height={14}
                                                className="size-3.5 dark:invert mr-2 opacity-50"
                                            />
                                            Source
                                        </Link>
                                    </Button>
                                </div>
                            </div>

                            {/* Provider strip — right-aligned on desktop */}
                            <div
                                className="animate-in fade-in-0"
                                style={{
                                    animationDuration: "600ms",
                                    animationDelay: "700ms",
                                    animationFillMode: "backwards",
                                }}>
                                <div className="text-[10px] tracking-widest uppercase text-muted-foreground/50 mb-3">
                                    Supported providers
                                </div>
                                <div className="grid grid-cols-2 md:flex md:items-center gap-2 md:gap-3">
                                    {Object.values(AccountType).map((type) => (
                                        <div
                                            key={type}
                                            className="group flex items-center gap-2 md:pr-3 md:border-r border-border/30 md:last:border-0 md:last:pr-0">
                                            <Image
                                                src={ACCOUNT_TYPE_ICONS[type]}
                                                alt={ACCOUNT_TYPE_LABELS[type]}
                                                width={16}
                                                height={16}
                                                className="size-4 rounded-sm opacity-70 group-hover:opacity-100 transition-opacity"
                                                unoptimized
                                            />
                                            <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                                                {ACCOUNT_TYPE_LABELS[type]}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Scroll indicator */}
                <a
                    href="#stats"
                    className="absolute bottom-6 left-1/2 -translate-x-1/2 text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors animate-in fade-in-0"
                    style={{ animationDuration: "600ms", animationDelay: "1000ms", animationFillMode: "backwards" }}>
                    <ChevronDownIcon className="size-5 animate-bounce" style={{ animationDuration: "2s" }} />
                </a>
            </section>

            {/* ─── STATS ─── */}
            <section id="stats" className="border-y border-border/50 bg-muted/10">
                <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4">
                    {highlights.map((stat, i) => (
                        <div
                            key={stat.label}
                            className={`px-5 py-5 sm:px-6 sm:py-6 md:py-8 lg:px-8 ${i % 2 === 1 ? "border-l border-border/40" : ""} ${i >= 2 ? "border-t md:border-t-0 border-border/40" : ""} ${i >= 2 ? "md:border-l md:border-border/40" : ""}`}>
                            <div className="sm:flex sm:items-baseline sm:gap-2 mb-1">
                                <div className="text-2xl sm:text-3xl md:text-4xl font-light text-foreground leading-none tracking-tight">
                                    {stat.value}
                                </div>
                                <div className="text-[9px] sm:text-[10px] tracking-widest uppercase text-muted-foreground/50 mt-1 sm:mt-0">
                                    {stat.label}
                                </div>
                            </div>
                            <p className="text-[11px] sm:text-xs text-muted-foreground/50 leading-relaxed">
                                {stat.detail}
                            </p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ─── PREVIEW ─── */}
            <section className="px-6 py-20 md:py-28 md:px-12 lg:px-20">
                <div className="max-w-7xl mx-auto">
                    <div className="grid md:grid-cols-[200px_1fr] lg:grid-cols-[260px_1fr] gap-8 md:gap-12 items-start">
                        {/* Section label — stacked left on desktop */}
                        <div className="md:sticky md:top-24 space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="h-px w-6 bg-primary" />
                                <span className="text-xs tracking-widest uppercase text-muted-foreground">Preview</span>
                            </div>
                            <p className="text-sm text-muted-foreground leading-relaxed hidden md:block">
                                Explore the interface across dashboard, file explorer, media player, search, and addon
                                views.
                            </p>
                        </div>
                        {/* Gallery */}
                        <Gallery items={screenshots} />
                    </div>
                </div>
            </section>

            {/* ─── CAPABILITIES ─── */}
            <section className="px-6 py-12 md:py-20 md:px-12 lg:px-20 bg-muted/15">
                <div className="max-w-7xl mx-auto space-y-6 md:space-y-10">
                    <div className="flex items-center gap-4">
                        <div className="flex-1 h-px bg-border/50" />
                        <span className="text-xs text-muted-foreground tracking-widest uppercase">What you can do</span>
                        <div className="flex-1 h-px bg-border/50" />
                    </div>

                    <div className="grid md:grid-cols-3">
                        {capabilities.map((step, i) => (
                            <div
                                key={step.num}
                                className={`py-4 first:pt-0 last:pb-0 md:py-0 md:px-6 lg:px-8 first:md:pl-0 last:md:pr-0 ${i > 0 ? "border-t md:border-t-0 md:border-l border-border/40" : ""}`}>
                                <div className="flex items-baseline gap-2 mb-1.5">
                                    <span className="text-xs tracking-widest text-primary/50">{step.num}</span>
                                    <h3 className="text-base sm:text-lg font-light">{step.title}</h3>
                                </div>
                                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── FEATURES GRID ─── */}
            <section className="px-6 py-16 md:py-28 md:px-12 lg:px-20">
                <div className="max-w-7xl mx-auto space-y-10 md:space-y-20">
                    <div className="max-w-md">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="h-px w-6 bg-primary" />
                            <span className="text-xs tracking-widest uppercase text-muted-foreground">
                                Everything included
                            </span>
                        </div>
                        <h2 className="text-2xl md:text-3xl font-light">
                            Built for power users who value <span className="text-muted-foreground">simplicity</span>
                        </h2>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-border/50">
                        {[
                            { title: "Multi-account", desc: "Manage multiple debrid accounts from a single dashboard" },
                            { title: "Real-time tracking", desc: "Monitor downloads and transfers as they happen" },
                            { title: "Stremio addons", desc: "Browse and install Stremio-compatible content addons" },
                            {
                                title: "Auto playback",
                                desc: "Automatically select the best sources for instant streaming",
                            },
                            {
                                title: "Keyboard shortcuts",
                                desc: "Navigate the entire interface without touching the mouse",
                            },
                            {
                                title: "Dark & light themes",
                                desc: "Refined editorial design that adapts to your preference",
                            },
                            {
                                title: "Drag & drop uploads",
                                desc: "Add torrents and magnets by dropping them into the browser",
                            },
                            {
                                title: "Episode browser",
                                desc: "Navigate TV shows by season and episode with progress tracking",
                            },
                            {
                                title: "Cross-source search",
                                desc: "Search across all connected accounts and addon sources at once",
                            },
                        ].map((feature, i, arr) => (
                            <div
                                key={feature.title}
                                className={`bg-background p-4 sm:p-6 md:p-8 group hover:bg-muted/30 transition-colors duration-300 ${i === arr.length - 1 ? "col-span-2 lg:col-span-1" : ""}`}>
                                <h4 className="text-xs sm:text-sm font-medium mb-1 sm:mb-2 group-hover:text-primary transition-colors duration-300">
                                    {feature.title}
                                </h4>
                                <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed">
                                    {feature.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── TECH + OPEN SOURCE ─── */}
            <section className="border-y border-border/50 bg-muted/10">
                <div className="max-w-7xl mx-auto grid md:grid-cols-2">
                    {/* Tech stack */}
                    <div className="px-6 py-12 md:py-16 md:px-12 lg:px-16 md:border-r border-border/50">
                        <div className="text-[10px] tracking-widest uppercase text-muted-foreground mb-6">
                            Built with
                        </div>
                        <div className="flex flex-wrap gap-6">
                            {techStack.map((tech) => (
                                <span key={tech.name} className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <img
                                        src={`https://cdn.jsdelivr.net/npm/simple-icons@v14/icons/${tech.icon}.svg`}
                                        alt={`${tech.name} logo`}
                                        width={14}
                                        height={14}
                                        className="size-3.5 opacity-40 dark:invert"
                                    />
                                    {tech.name}
                                </span>
                            ))}
                        </div>
                    </div>
                    {/* CTA */}
                    <div className="px-6 py-12 md:py-16 md:px-12 lg:px-16 border-t md:border-t-0 border-border/50">
                        <div className="text-[10px] tracking-widest uppercase text-muted-foreground mb-6">
                            Get started
                        </div>
                        <p className="text-sm text-muted-foreground mb-6 max-w-sm leading-relaxed">
                            Free and open source. No credit card, no tracking, no compromises.
                        </p>
                        <div className="flex flex-wrap gap-3">
                            <Button asChild size="lg" className="h-10 px-6">
                                <Link href="/dashboard">
                                    Open App
                                    <ArrowRightIcon className="size-4 ml-2" />
                                </Link>
                            </Button>
                            <Button asChild variant="outline" size="default" className="h-10 px-5">
                                <Link
                                    href="https://github.com/viperadnan-git/debridui"
                                    target="_blank"
                                    rel="noopener noreferrer">
                                    Star on GitHub
                                    <ArrowUpRightIcon className="size-3 ml-1.5 opacity-50" />
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </section>

            {/* ─── COMMUNITY ─── */}
            <section className="px-6 py-16 md:py-20 md:px-12 lg:px-20">
                <div className="max-w-7xl mx-auto">
                    <div className="max-w-md">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="h-px w-6 bg-primary" />
                            <span className="text-xs tracking-widest uppercase text-muted-foreground">Community</span>
                        </div>
                        <h2 className="text-xl md:text-2xl font-light mb-3">Join the conversation</h2>
                        <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                            Get help, share feedback, and stay updated with development.
                        </p>
                        <div className="flex flex-wrap gap-3">
                            {DISCORD_URL && (
                                <Button asChild className="h-10 px-5 bg-[#5865F2] hover:bg-[#4752C4] text-white">
                                    <Link href={DISCORD_URL} target="_blank" rel="noopener noreferrer">
                                        <img
                                            src="https://cdn.simpleicons.org/discord/white"
                                            alt="Discord logo"
                                            width={16}
                                            height={16}
                                            className="size-4 mr-2"
                                        />
                                        Discord
                                    </Link>
                                </Button>
                            )}
                            <Button asChild variant="outline" className="h-10 px-5">
                                <Link
                                    href="https://github.com/viperadnan-git/debridui"
                                    target="_blank"
                                    rel="noopener noreferrer">
                                    <img
                                        src="https://cdn.jsdelivr.net/npm/simple-icons@v14/icons/github.svg"
                                        alt="GitHub logo"
                                        width={16}
                                        height={16}
                                        className="size-4 dark:invert mr-2 opacity-60"
                                    />
                                    GitHub
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </section>

            {/* ─── DISCLAIMER ─── */}
            <section className="px-6 py-10 md:px-12 lg:px-20 border-t border-border/50 bg-muted/10">
                <div className="max-w-7xl mx-auto">
                    <div className="max-w-xl">
                        <div className="text-[10px] text-muted-foreground/60 tracking-widest uppercase mb-2">
                            Disclaimer
                        </div>
                        <p className="text-xs text-muted-foreground/60 leading-relaxed mb-2">
                            DebridUI is a client interface only and does not provide, host, or stream any content. It
                            connects to third-party debrid service APIs to display authorized users&apos; private files.
                            Users are solely responsible for ensuring their use complies with applicable laws and
                            service terms.
                        </p>
                        <Link
                            href="https://github.com/viperadnan-git/debridui/blob/main/DISCLAIMER.md"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors underline underline-offset-4">
                            Full disclaimer
                        </Link>
                    </div>
                </div>
            </section>

            {/* ─── FOOTER ─── */}
            <footer className="px-6 py-6 md:px-12 lg:px-20 border-t border-border/50">
                <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <Image
                            className="dark:invert h-3.5 w-auto opacity-50"
                            src="/logo.svg"
                            alt="DebridUI"
                            width={70}
                            height={22}
                        />
                        <span className="text-[10px] text-muted-foreground/50">&copy; {new Date().getFullYear()}</span>
                    </div>
                    <nav className="flex items-center gap-5 text-[10px] tracking-wider uppercase">
                        <Link
                            href="https://github.com/viperadnan-git/debridui#readme"
                            target="_blank"
                            className="text-muted-foreground/50 hover:text-foreground transition-colors">
                            Docs
                        </Link>
                        <Link
                            href="https://github.com/viperadnan-git/debridui/issues"
                            target="_blank"
                            className="text-muted-foreground/50 hover:text-foreground transition-colors">
                            Issues
                        </Link>
                        <Link
                            href="https://github.com/viperadnan-git/debridui/blob/main/LICENSE"
                            target="_blank"
                            className="text-muted-foreground/50 hover:text-foreground transition-colors">
                            GPL-3.0
                        </Link>
                    </nav>
                </div>
            </footer>
        </div>
    );
}
