"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Separator } from "@/components/ui/separator";
import { AuthShell } from "@/features/auth/components/auth-shell";
import { EmailOTPForm } from "@/features/auth/components/email-otp-form";
import { GoogleSignInButton } from "@/features/auth/components/google-signin-button";
import { usePendingVerification } from "@/features/auth/hooks/use-pending-verification";
import { getCallbackUrl } from "@/features/auth/utils/callback-url";
import { authClient } from "@/lib/auth-client";
import { GOOGLE_CLIENT_ID } from "@/lib/constants";

const loginSchema = z.object({
    email: z.email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
});

export default function LoginForm({ canResetPassword }: { canResetPassword: boolean }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const callbackUrl = getCallbackUrl(searchParams) ?? "/dashboard";
    const [isRedirecting, setIsRedirecting] = useState(false);
    const { pendingEmail, setPendingEmail, codeJustSent } = usePendingVerification();

    const form = useForm<z.infer<typeof loginSchema>>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    });

    async function onSubmit(values: z.infer<typeof loginSchema>) {
        try {
            const { data, error } = await authClient.signIn.email({
                email: values.email,
                password: values.password,
            });

            if (error) {
                // Server already sent a fresh code
                if (error.code === "EMAIL_NOT_VERIFIED") setPendingEmail(values.email);
                else toast.error(error.message || "Failed to sign in");
                return;
            }

            if (data) onLoggedIn();
        } catch {
            toast.error("An unexpected error occurred");
        }
    }

    function onLoggedIn() {
        setIsRedirecting(true);
        toast.success("Logged in successfully");
        router.push(callbackUrl);
    }

    const isDisabled = form.formState.isSubmitting || isRedirecting;
    const typedEmail = form.watch("email");
    const resetParams = new URLSearchParams({
        ...(typedEmail && { email: typedEmail }),
        ...(callbackUrl !== "/dashboard" && { callbackUrl }),
    });
    const resetHref = `/forgot-password${resetParams.size ? `?${resetParams}` : ""}`;

    return (
        <AuthShell
            title={pendingEmail ? "Check Your Email" : "Welcome Back"}
            description={pendingEmail ? undefined : "Sign in to your account"}>
            {pendingEmail ? (
                <EmailOTPForm
                    email={pendingEmail}
                    codeJustSent={codeJustSent}
                    onVerified={onLoggedIn}
                    onBack={() => setPendingEmail(null)}
                />
            ) : (
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6">
                        <GoogleSignInButton callbackURL={callbackUrl} disabled={isDisabled} />

                        {/* Runtime comparison for Docker env injection support */}
                        {!!GOOGLE_CLIENT_ID && (
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <Separator />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-background px-2 text-muted-foreground">
                                        Or continue with email
                                    </span>
                                </div>
                            </div>
                        )}

                        <div className="flex flex-col gap-6">
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email</FormLabel>
                                        <FormControl>
                                            <Input type="email" placeholder="name@example.com" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <div className="flex items-center justify-between">
                                            <FormLabel>Password</FormLabel>
                                            {canResetPassword && (
                                                <Link
                                                    href={resetHref}
                                                    className="text-sm text-muted-foreground underline-offset-4 hover:text-primary hover:underline">
                                                    Forgot password?
                                                </Link>
                                            )}
                                        </div>
                                        <FormControl>
                                            <PasswordInput placeholder="Enter your password" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <Button type="submit" className="w-full" disabled={isDisabled}>
                                {isDisabled ? "Signing in..." : "Sign In"}
                            </Button>
                        </div>

                        <div className="text-center text-sm">
                            Don&apos;t have an account?{" "}
                            <Link
                                href={
                                    callbackUrl !== "/dashboard"
                                        ? `/signup?callbackUrl=${encodeURIComponent(callbackUrl)}`
                                        : "/signup"
                                }
                                className="underline underline-offset-4 hover:text-primary">
                                Sign up
                            </Link>
                        </div>
                    </form>
                </Form>
            )}
        </AuthShell>
    );
}
