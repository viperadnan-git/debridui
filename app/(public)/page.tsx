import Image from "next/image";
import Link from "next/link";
import { ArrowRightIcon, ArrowUpRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Gallery } from "@/components/gallery";
import { DISCORD_URL, ACCOUNT_TYPE_LABELS, ACCOUNT_TYPE_ICONS } from "@/lib/constants";
import { AccountType } from "@/lib/types";

const screenshots = [
    {
        id: "dashboard",
        label: "Dashboard",
        src: "https://res.cloudinary.com/viperadnan/image/upload/v1769483514/debridui-mockup-1.jpg",
    },
    {
        id: "explorer",
        label: "Explorer",
        src: "https://res.cloudinary.com/viperadnan/image/upload/v1769483514/debridui-mockup-2.jpg",
    },
    {
        id: "media",
        label: "Media",
        src: "https://res.cloudinary.com/viperadnan/image/upload/v1769483514/debridui-mockup-3.jpg",
    },
    {
        id: "search",
        label: "Search",
        src: "https://res.cloudinary.com/viperadnan/image/upload/v1769483514/debridui-mockup-4.jpg",
    },
    {
        id: "addons",
        label: "Addons",
        src: "https://res.cloudinary.com/viperadnan/image/upload/v1769483514/debridui-mockup-5.jpg",
    },
];

const techStack = [
    { name: "Next.js", icon: "nextdotjs" },
    { name: "TypeScript", icon: "typescript" },
    { name: "Tailwind", icon: "tailwindcss" },
    { name: "PostgreSQL", icon: "postgresql" },
];

const features = [
    {
        category: "Files",
        items: [
            "Multi-account support",
            "Real-time tracking",
            "Tree view & batch ops",
            "Stream to VLC, Kodi, MPV",
            "Drag & drop uploads",
        ],
    },
    {
        category: "Discovery",
        items: [
            "Trakt.tv integration",
            "Stremio addons support",
            "Cross-source search",
            "Ratings & trailers",
            "Episode browser",
        ],
    },
    {
        category: "Experience",
        items: [
            "Crafted for intuitive UX",
            "Dark & light themes",
            "Fully responsive",
            "Keyboard shortcuts",
            "Progress tracking",
        ],
    },
];

const steps = [
    { num: "01", title: "Sign up", desc: "Create account or use Google" },
    { num: "02", title: "Connect", desc: "Link Real-Debrid, TorBox, or AllDebrid" },
    { num: "03", title: "Stream", desc: "Browse and play content" },
];

export default function Home() {
    return (
        <div className="min-h-screen">
            {/* Hero */}
            <section className="min-h-svh flex flex-col justify-center px-6 py-20 md:px-12 lg:px-20">
                <div className="max-w-6xl mx-auto w-full">
                    {/* Top bar */}
                    <div className="flex items-center justify-between mb-16 md:mb-24">
                        <div className="flex items-center gap-4 text-xs text-muted-foreground tracking-wide uppercase">
                            {techStack.map((tech, i) => (
                                <span key={tech.name} className="hidden sm:flex items-center gap-1.5">
                                    {i > 0 && <span className="text-border mr-4">·</span>}
                                    <img
                                        src={`https://cdn.jsdelivr.net/npm/simple-icons@v14/icons/${tech.icon}.svg`}
                                        alt={`${tech.name} logo`}
                                        width={12}
                                        height={12}
                                        className="size-3 opacity-50 dark:invert"
                                    />
                                    {tech.name}
                                </span>
                            ))}
                            <Badge className="tracking-wider transition-none">Open Source</Badge>
                        </div>
                    </div>

                    {/* Main content */}
                    <div className="space-y-8 md:space-y-12">
                        <Image
                            className="dark:invert w-full max-w-[220px] sm:max-w-[320px] md:max-w-[420px] h-auto"
                            src="/logo.svg"
                            alt="DebridUI"
                            width={420}
                            height={137}
                            priority
                        />

                        <p className="text-muted-foreground text-xl sm:text-2xl md:text-3xl max-w-xl leading-snug font-light">
                            A modern debrid client with integrated media discovery and streaming.
                        </p>

                        <div className="flex flex-wrap items-center gap-3 pt-4">
                            <Button asChild size="lg" className="h-12 tracking-wide">
                                <Link href="/dashboard">
                                    Open App
                                    <ArrowRightIcon className="size-4 ml-2" />
                                </Link>
                            </Button>
                            <Button asChild variant="ghost" size="lg" className="h-12 tracking-wide">
                                <Link
                                    href="https://github.com/viperadnan-git/debridui"
                                    target="_blank"
                                    rel="noopener noreferrer">
                                    <img
                                        src="https://cdn.jsdelivr.net/npm/simple-icons@v14/icons/github.svg"
                                        alt="GitHub logo"
                                        width={16}
                                        height={16}
                                        className="size-4 dark:invert mr-2 opacity-70"
                                    />
                                    Source
                                    <ArrowUpRightIcon className="size-3 ml-1 opacity-50" />
                                </Link>
                            </Button>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 pt-2 text-sm text-muted-foreground">
                            <span>Supports</span>
                            {Object.values(AccountType).map((type, i) => (
                                <span key={type} className="inline-flex items-center gap-1.5">
                                    {i > 0 && <span className="text-border mr-1.5">·</span>}
                                    <Image
                                        src={ACCOUNT_TYPE_ICONS[type]}
                                        alt={ACCOUNT_TYPE_LABELS[type]}
                                        width={16}
                                        height={16}
                                        className="size-4 rounded-sm"
                                        unoptimized
                                    />
                                    <span className="font-medium text-foreground">{ACCOUNT_TYPE_LABELS[type]}</span>
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Preview */}
            <section className="px-6 pb-20 md:px-12 lg:px-20">
                <div className="max-w-6xl mx-auto">
                    <Gallery items={screenshots} />
                </div>
            </section>

            {/* Divider with label */}
            <div className="px-6 md:px-12 lg:px-20">
                <div className="max-w-6xl mx-auto flex items-center gap-4">
                    <div className="flex-1 h-px bg-border/50" />
                    <span className="text-xs text-muted-foreground tracking-wider uppercase">How it works</span>
                    <div className="flex-1 h-px bg-border/50" />
                </div>
            </div>

            {/* Steps */}
            <section className="px-6 py-20 md:px-12 md:py-32 lg:px-20">
                <div className="max-w-6xl mx-auto">
                    <div className="grid md:grid-cols-3 gap-12 md:gap-8">
                        {steps.map((step) => (
                            <div key={step.num} className="group">
                                <div className="text-xs text-muted-foreground tracking-widest mb-4">{step.num}</div>
                                <h3 className="text-lg font-medium mb-2">{step.title}</h3>
                                <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Divider with label */}
            <div className="px-6 md:px-12 lg:px-20">
                <div className="max-w-6xl mx-auto flex items-center gap-4">
                    <div className="flex-1 h-px bg-border/50" />
                    <span className="text-xs text-muted-foreground tracking-wider uppercase">Features</span>
                    <div className="flex-1 h-px bg-border/50" />
                </div>
            </div>

            {/* Features */}
            <section className="px-6 py-20 md:px-12 md:py-32 lg:px-20">
                <div className="max-w-6xl mx-auto">
                    <div className="grid md:grid-cols-3 gap-12 md:gap-16">
                        {features.map((section) => (
                            <div key={section.category}>
                                <h3 className="text-xs text-primary tracking-widest uppercase mb-6">
                                    {section.category}
                                </h3>
                                <ul className="space-y-3">
                                    {section.items.map((item) => (
                                        <li
                                            key={item}
                                            className="text-sm text-foreground/70 leading-relaxed pl-4 border-l border-border/50">
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Community */}
            <section className="px-6 py-20 md:px-12 md:py-32 lg:px-20 border-t border-border/50">
                <div className="max-w-6xl mx-auto">
                    <div className="max-w-md">
                        <h2 className="text-2xl md:text-3xl font-light mb-4">Join the community</h2>
                        <p className="text-muted-foreground mb-8 leading-relaxed">
                            Get help, share feedback, and stay updated.
                        </p>
                        <div className="flex flex-wrap gap-3">
                            {DISCORD_URL && (
                                <Button asChild className="h-11 px-5 bg-[#5865F2] hover:bg-[#4752C4] text-white">
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
                            <Button asChild variant="outline" className="h-11 px-5">
                                <Link
                                    href="https://github.com/viperadnan-git/debridui"
                                    target="_blank"
                                    rel="noopener noreferrer">
                                    <img
                                        src="https://cdn.jsdelivr.net/npm/simple-icons@v14/icons/github.svg"
                                        alt="GitHub logo"
                                        width={16}
                                        height={16}
                                        className="size-4 dark:invert mr-2 opacity-70"
                                    />
                                    GitHub
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="px-6 py-20 md:px-12 md:py-32 lg:px-20 bg-muted/30">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-8">
                    <div>
                        <h2 className="text-2xl md:text-3xl font-light mb-2">Ready to start?</h2>
                        <p className="text-muted-foreground">Free and open source. No credit card required.</p>
                    </div>
                    <Button asChild size="lg" className="h-12 px-8">
                        <Link href="/dashboard">
                            Open App
                            <ArrowRightIcon className="size-4 ml-2" />
                        </Link>
                    </Button>
                </div>
            </section>

            {/* Disclaimer */}
            <section className="px-6 py-12 md:px-12 lg:px-20 border-t border-border/50 bg-muted/20">
                <div className="max-w-6xl mx-auto">
                    <div className="max-w-2xl">
                        <h3 className="text-xs text-muted-foreground tracking-widest uppercase mb-3">
                            Important Notice
                        </h3>
                        <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                            DebridUI is a client interface only and does not provide, host, or stream any content. It
                            connects to third-party debrid service APIs to display authorized users&apos; private files.
                            Users are solely responsible for ensuring their use complies with applicable laws and
                            service terms.
                        </p>
                        <Link
                            href="https://github.com/viperadnan-git/debridui/blob/main/DISCLAIMER.md"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline underline-offset-4">
                            Read full disclaimer →
                        </Link>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="px-6 py-8 md:px-12 lg:px-20 border-t border-border/50">
                <div className="max-w-6xl mx-auto">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                        <div className="flex items-center gap-3">
                            <Image
                                className="dark:invert h-4 w-auto opacity-70"
                                src="/logo.svg"
                                alt="DebridUI"
                                width={80}
                                height={26}
                            />
                            <span className="text-xs text-muted-foreground">© {new Date().getFullYear()} DebridUI</span>
                        </div>

                        <nav className="flex items-center gap-6 text-sm">
                            <Link
                                href="https://github.com/viperadnan-git/debridui#readme"
                                target="_blank"
                                className="text-muted-foreground hover:text-foreground transition-colors">
                                Docs
                            </Link>
                            <Link
                                href="https://github.com/viperadnan-git/debridui/issues"
                                target="_blank"
                                className="text-muted-foreground hover:text-foreground transition-colors">
                                Issues
                            </Link>
                            <Link
                                href="https://github.com/viperadnan-git/debridui/blob/main/LICENSE"
                                target="_blank"
                                className="text-muted-foreground hover:text-foreground transition-colors">
                                GPL-3.0
                            </Link>
                        </nav>
                    </div>
                </div>
            </footer>
        </div>
    );
}
