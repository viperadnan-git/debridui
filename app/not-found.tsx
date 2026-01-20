import { Button } from "@/components/ui/button";
import { FileQuestion } from "lucide-react";

export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center h-screen gap-8 p-4">
            <div className="flex flex-col items-center justify-center gap-4 text-center">
                <FileQuestion className="h-16 w-16 text-muted-foreground" />
                <h1 className="text-4xl font-bold">404 - Page Not Found</h1>
                <p className="text-lg text-muted-foreground max-w-md">
                    The page you&apos;re looking for doesn&apos;t exist or has been moved.
                </p>
            </div>
            <div className="flex gap-4">
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
