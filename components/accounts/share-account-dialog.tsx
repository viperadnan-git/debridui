"use client";

import { useMemo } from "react";
import { Copy, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User } from "@/lib/types";
import { encodeAccountData } from "@/lib/utils";
import { toast } from "sonner";

interface ShareAccountDialogProps {
    user: User;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ShareAccountDialog({ user, open, onOpenChange }: ShareAccountDialogProps) {
    const shareUrl = useMemo(() => {
        const data = {
            type: user.type,
            apiKey: user.apiKey,
        };
        const encoded = encodeAccountData(data);
        const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
        return `${baseUrl}/login?data=${encoded}`;
    }, [user.type, user.apiKey]);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            toast.success("URL copied to clipboard");
        } catch {
            toast.error("Failed to copy URL");
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Share Account</DialogTitle>
                    <DialogDescription>
                        Generate a URL to quickly add this account on another device or browser
                    </DialogDescription>
                </DialogHeader>

                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Security Warning</AlertTitle>
                    <AlertDescription className="text-xs">
                        This URL contains your API key and credentials. Anyone with this URL can access your account.
                        Only share with trusted devices you own.
                    </AlertDescription>
                </Alert>

                <div className="space-y-2">
                    <Label htmlFor="share-url">Share URL</Label>
                    <div className="flex gap-2">
                        <Input
                            id="share-url"
                            value={shareUrl}
                            readOnly
                            className="font-mono text-xs"
                            onClick={(e) => e.currentTarget.select()}
                        />
                        <Button size="icon" variant="outline" onClick={handleCopy}>
                            <Copy className="h-4 w-4" />
                        </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        This URL will auto-fill the login form with your account details
                    </p>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
