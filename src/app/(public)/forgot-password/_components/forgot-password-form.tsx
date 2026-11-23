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
import { Spinner } from "@/components/ui/spinner";
import { AuthShell } from "@/features/auth/components/auth-shell";
import { EmailOTPForm } from "@/features/auth/components/email-otp-form";
import { usePendingVerification } from "@/features/auth/hooks/use-pending-verification";
import { getCallbackUrl } from "@/features/auth/utils/callback-url";
import { authClient } from "@/lib/auth-client";

const emailSchema = z.object({ email: z.email("Invalid email address") });
const passwordSchema = z
    .object({
        password: z
            .string()
            .min(8, "Password must be at least 8 characters")
            .max(128, "Password must be at most 128 characters"),
        confirmPassword: z.string(),
    })
    .refine((v) => v.password === v.confirmPassword, {
        message: "Passwords don't match",
        path: ["confirmPassword"],
    });

export default function ForgotPasswordForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const callbackUrl = getCallbackUrl(searchParams) ?? "/dashboard";
    const loginUrl = callbackUrl !== "/dashboard" ? `/login?callbackUrl=${encodeURIComponent(callbackUrl)}` : "/login";
    const { pendingEmail, setPendingEmail, codeJustSent } = usePendingVerification();
    // Checked code, kept in memory only; a refresh returns to the code step
    const [otp, setOtp] = useState<string | null>(null);
    const [isRedirecting, setIsRedirecting] = useState(false);

    const emailForm = useForm<z.infer<typeof emailSchema>>({
        resolver: zodResolver(emailSchema),
        defaultValues: { email: searchParams.get("email") ?? "" },
    });
    const passwordForm = useForm<z.infer<typeof passwordSchema>>({
        resolver: zodResolver(passwordSchema),
        defaultValues: { password: "", confirmPassword: "" },
    });

    async function requestCode({ email }: z.infer<typeof emailSchema>) {
        const { error } = await authClient.emailOtp.requestPasswordReset({ email });
        if (error) {
            toast.error(error.message || "Couldn't send a reset code");
            return;
        }
        setPendingEmail(email);
    }

    async function resetPassword({ password }: z.infer<typeof passwordSchema>) {
        if (!pendingEmail || !otp) return;
        const { error } = await authClient.emailOtp.resetPassword({ email: pendingEmail, otp, password });
        if (error) {
            // Code expired or was used up between steps
            if (["OTP_EXPIRED", "INVALID_OTP", "TOO_MANY_ATTEMPTS"].includes(error.code ?? "")) {
                setOtp(null);
                // Back to the code step with resend unlocked: no new code was sent
                setPendingEmail(pendingEmail, { codeSent: false });
                toast.error("That code is no longer valid. Resend a new one.");
            } else toast.error(error.message || "Couldn't reset your password");
            return;
        }
        setIsRedirecting(true);
        const signIn = await authClient.signIn.email({ email: pendingEmail, password });
        if (signIn.error) {
            toast.success("Password reset. Log in with your new password.");
            router.push(loginUrl);
            return;
        }
        toast.success("Password reset");
        router.push(callbackUrl);
    }

    const step = otp && pendingEmail ? "password" : pendingEmail ? "code" : "email";

    return (
        <AuthShell
            title={{ email: "Reset Your Password", code: "Check Your Email", password: "Choose a New Password" }[step]}
            description={
                step === "email" ? (
                    "Enter your account email and we'll send you a reset code."
                ) : step === "password" ? (
                    <>
                        For <span className="font-medium text-foreground [overflow-wrap:anywhere]">{pendingEmail}</span>
                        . You&apos;ll be signed out on other devices.
                    </>
                ) : undefined
            }>
            {step === "password" ? (
                <Form {...passwordForm}>
                    <form onSubmit={passwordForm.handleSubmit(resetPassword)} className="flex flex-col gap-6">
                        <FormField
                            control={passwordForm.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>New password</FormLabel>
                                    <FormControl>
                                        <PasswordInput
                                            placeholder="At least 8 characters"
                                            autoComplete="new-password"
                                            autoFocus
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={passwordForm.control}
                            name="confirmPassword"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Confirm new password</FormLabel>
                                    <FormControl>
                                        <PasswordInput
                                            placeholder="Re-enter your new password"
                                            autoComplete="new-password"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button
                            type="submit"
                            size="lg"
                            className="w-full"
                            disabled={passwordForm.formState.isSubmitting || isRedirecting}>
                            {(passwordForm.formState.isSubmitting || isRedirecting) && <Spinner />}
                            Reset Password
                        </Button>
                    </form>
                </Form>
            ) : step === "code" && pendingEmail ? (
                <EmailOTPForm
                    email={pendingEmail}
                    codeJustSent={codeJustSent}
                    type="forget-password"
                    onVerified={setOtp}
                    onBack={() => setPendingEmail(null)}
                />
            ) : (
                <Form {...emailForm}>
                    <form onSubmit={emailForm.handleSubmit(requestCode)} className="flex flex-col gap-6">
                        <FormField
                            control={emailForm.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email</FormLabel>
                                    <FormControl>
                                        <Input type="email" placeholder="name@example.com" autoFocus {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="submit" className="w-full" disabled={emailForm.formState.isSubmitting}>
                            {emailForm.formState.isSubmitting ? "Sending code..." : "Send Reset Code"}
                        </Button>
                        <div className="text-center text-sm">
                            Remembered it?{" "}
                            <Link href={loginUrl} className="underline underline-offset-4 hover:text-primary">
                                Back to sign in
                            </Link>
                        </div>
                    </form>
                </Form>
            )}
        </AuthShell>
    );
}
