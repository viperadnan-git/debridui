import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center h-screen gap-8">
            <div className="flex flex-col items-center justify-center">
                <h1 className="text-4xl font-bold">404</h1>
                <p className="text-lg text-muted-foreground">Page not found</p>
            </div>
            <Button>
                <Link href="/dashboard">Go back to home</Link>
            </Button>
        </div>
    );
}
