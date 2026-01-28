import { Button } from "@/components/ui/button";
import { FileQuestion } from "lucide-react";

export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen gap-10 p-6">
            <div className="flex flex-col items-center gap-6 text-center max-w-md">
                <FileQuestion className="size-10 text-muted-foreground" strokeWidth={1.5} />
                <div className="space-y-3">
                    <h1 className="text-2xl sm:text-3xl font-light">Page not found</h1>
                    <p className="text-sm text-muted-foreground">
                        The page you&apos;re looking for doesn&apos;t exist or has been moved.
                    </p>
                </div>
                <span className="text-xs tracking-widest uppercase text-muted-foreground">404</span>
            </div>
            <div className="flex gap-3">
                <Button asChild>
                    <a href="/dashboard">Go to Dashboard</a>
                </Button>
                <Button variant="outline" asChild>
                    <a href="/files">Browse Files</a>
                </Button>
            </div>
        </div>
    );
}
