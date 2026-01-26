import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { HelpCircle, ExternalLink, MessageCircle, Bug, Lightbulb, BookOpen } from "lucide-react";
import { DISCORD_URL } from "@/lib/constants";

export default function HelpPage() {
    return (
        <div className="mx-auto w-full max-w-5xl space-y-8 pb-16">
            <PageHeader icon={HelpCircle} title="Help & Support" description="Get help and connect with the community" />

            <div className="grid gap-6 md:grid-cols-2">
                {DISCORD_URL && (
                    <Card className="md:col-span-2 lg:col-span-1 border-[#5865F2]/20 bg-[#5865F2]/5">
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[#5865F2]/10">
                                    <img
                                        src="https://cdn.simpleicons.org/discord/5865F2"
                                        alt="Discord"
                                        className="h-5 w-5"
                                    />
                                </div>
                                <div>
                                    <CardTitle>Join our Discord</CardTitle>
                                    <CardDescription>The fastest way to get help</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2 text-sm text-muted-foreground">
                                <div className="flex items-start gap-2">
                                    <MessageCircle className="h-4 w-4 mt-0.5 text-[#5865F2]" />
                                    <span>Get quick answers from the community</span>
                                </div>
                                <div className="flex items-start gap-2">
                                    <Bug className="h-4 w-4 mt-0.5 text-[#5865F2]" />
                                    <span>Report bugs and get real-time support</span>
                                </div>
                                <div className="flex items-start gap-2">
                                    <Lightbulb className="h-4 w-4 mt-0.5 text-[#5865F2]" />
                                    <span>Request features and share ideas</span>
                                </div>
                                <div className="flex items-start gap-2">
                                    <BookOpen className="h-4 w-4 mt-0.5 text-[#5865F2]" />
                                    <span>Most FAQs are already answered there</span>
                                </div>
                            </div>
                            <Button
                                className="w-full gap-2 bg-[#5865F2] hover:bg-[#4752C4] text-white"
                                asChild>
                                <a href={DISCORD_URL} target="_blank" rel="noopener noreferrer">
                                    Join Discord Server
                                    <ExternalLink className="h-4 w-4" />
                                </a>
                            </Button>
                        </CardContent>
                    </Card>
                )}

                <Card className="md:col-span-2 lg:col-span-1">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10">
                                <img
                                    src="https://cdn.simpleicons.org/github"
                                    alt="GitHub"
                                    className="h-5 w-5 dark:invert"
                                />
                            </div>
                            <div>
                                <CardTitle>GitHub Repository</CardTitle>
                                <CardDescription>Source code and issue tracking</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            DebridUI is open source. View the code, track development progress, and contribute to the project.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-2">
                            <Button variant="outline" className="flex-1 gap-2" asChild>
                                <a
                                    href="https://github.com/viperadnan-git/debridui"
                                    target="_blank"
                                    rel="noopener noreferrer">
                                    <img
                                        src="https://cdn.simpleicons.org/github"
                                        alt="GitHub"
                                        className="h-4 w-4 dark:invert"
                                    />
                                    View Repository
                                    <ExternalLink className="h-3 w-3 opacity-50" />
                                </a>
                            </Button>
                            <Button variant="outline" className="flex-1 gap-2" asChild>
                                <a
                                    href="https://github.com/viperadnan-git/debridui/issues"
                                    target="_blank"
                                    rel="noopener noreferrer">
                                    <Bug className="h-4 w-4" />
                                    Open Issues
                                    <ExternalLink className="h-3 w-3 opacity-50" />
                                </a>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
