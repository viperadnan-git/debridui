"use client";

import { AddAccountForm } from "@/components/add-account-form";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { Separator } from "@/components/ui/separator";

export default function OnboardingPage() {
    const { logout, isLoggingOut } = useAuth();

    return (
        <div className="bg-background flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
            <div className="w-full max-w-sm">
                <div className="flex flex-col items-center gap-2 mb-6">
                    <Link href="/" className="flex flex-col items-center gap-2 font-medium">
                        <div className="flex size-12 items-center justify-center">
                            <Image
                                src="/icon.svg"
                                alt="DebridUI"
                                width={48}
                                height={48}
                                className="invert dark:invert-0"
                            />
                        </div>
                        <span className="sr-only">DebridUI</span>
                    </Link>
                    <h1 className="text-xl font-bold">Setup Your Account</h1>
                    <p className="text-sm text-muted-foreground text-center">
                        Add your debrid service account to get started
                    </p>
                </div>
                <AddAccountForm />
                <Separator className="my-4" />
                <Button
                    variant="outline"
                    type="button"
                    onClick={logout}
                    disabled={isLoggingOut}
                    className="w-full border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive">
                    {isLoggingOut ? (
                        <>
                            <LogOut className="h-4 w-4 mr-2" />
                            Logging out...
                        </>
                    ) : (
                        <>
                            <LogOut className="h-4 w-4 mr-2" />
                            Logout
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}
