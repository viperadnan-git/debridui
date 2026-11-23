"use client";

import { REGEXP_ONLY_DIGITS } from "input-otp";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Spinner } from "@/components/ui/spinner";
import { authClient } from "@/lib/auth-client";

const RESEND_COOLDOWN = 30;
// Errors about the code itself; anything else (rate limit, network) keeps the input and shows its own message
const CODE_ERRORS: Record<string, string> = {
    INVALID_OTP: "That code is incorrect. Check the email and try again.",
    OTP_EXPIRED: "This code has expired. Resend a new one.",
    TOO_MANY_ATTEMPTS: "Too many attempts. Resend a new code.",
};

interface EmailOTPFormProps {
    email: string;
    /** Start the resend cooldown; false when no code was just sent (e.g. after a refresh) */
    codeJustSent: boolean;
    /** "email-verification" verifies (and signs in); "forget-password" only checks the code for the reset step */
    type?: "email-verification" | "forget-password";
    onVerified: (otp: string) => void;
    onBack: () => void;
}

export function EmailOTPForm({
    email,
    codeJustSent,
    type = "email-verification",
    onVerified,
    onBack,
}: EmailOTPFormProps) {
    const [otp, setOtp] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isVerifying, setIsVerifying] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [cooldown, setCooldown] = useState(codeJustSent ? RESEND_COOLDOWN : 0);

    useEffect(() => {
        if (cooldown <= 0) return;
        const id = setTimeout(() => setCooldown((s) => s - 1), 1000);
        return () => clearTimeout(id);
    }, [cooldown]);

    async function verify(code: string) {
        setIsVerifying(true);
        const { error } =
            type === "email-verification"
                ? await authClient.emailOtp.verifyEmail({ email, otp: code })
                : await authClient.emailOtp.checkVerificationOtp({ email, type, otp: code });
        if (error) {
            setIsVerifying(false);
            const codeError = CODE_ERRORS[error.code ?? ""];
            if (codeError) setOtp("");
            // The code is dead: let them request a new one right away
            if (error.code === "OTP_EXPIRED" || error.code === "TOO_MANY_ATTEMPTS") setCooldown(0);
            setError(codeError ?? error.message ?? "Couldn't check the code. Try again.");
            return;
        }
        // Stay disabled while the parent moves on
        onVerified(code);
    }

    async function resend() {
        setIsResending(true);
        const { error } =
            type === "email-verification"
                ? await authClient.emailOtp.sendVerificationOtp({ email, type })
                : await authClient.emailOtp.requestPasswordReset({ email });
        setIsResending(false);
        if (error) {
            toast.error(error.message || "Couldn't send a new code");
            return;
        }
        setOtp("");
        setError(null);
        setCooldown(RESEND_COOLDOWN);
        toast.success(`New code sent to ${email}`);
    }

    return (
        <div className="flex flex-col gap-6">
            <p className="text-sm text-muted-foreground text-center">
                Enter the 6-digit code sent to
                <span className="block font-medium text-foreground [overflow-wrap:anywhere]">{email}</span>
            </p>

            <div className="flex flex-col gap-2">
                <InputOTP
                    maxLength={6}
                    pattern={REGEXP_ONLY_DIGITS}
                    value={otp}
                    onChange={(value) => {
                        setOtp(value);
                        setError(null);
                    }}
                    onComplete={verify}
                    disabled={isVerifying}
                    aria-label="Verification code"
                    aria-invalid={!!error}
                    aria-describedby={error ? "otp-error" : undefined}
                    containerClassName="w-full"
                    autoFocus>
                    <InputOTPGroup className="w-full">
                        {[0, 1, 2, 3, 4, 5].map((i) => (
                            <InputOTPSlot key={i} index={i} aria-invalid={!!error} className="flex-1" />
                        ))}
                    </InputOTPGroup>
                </InputOTP>
                {error && (
                    <p id="otp-error" role="alert" className="text-sm text-destructive">
                        {error}
                    </p>
                )}
            </div>

            <Button size="lg" className="w-full" disabled={otp.length < 6 || isVerifying} onClick={() => verify(otp)}>
                {isVerifying && <Spinner />}
                {type === "email-verification" ? "Verify Email" : "Continue"}
            </Button>

            <div className="flex flex-col items-center gap-3 text-sm">
                <p className="text-muted-foreground">
                    Didn&apos;t get it?{" "}
                    {cooldown > 0 ? (
                        <span className="tabular-nums">Resend in {cooldown}s</span>
                    ) : (
                        <button
                            type="button"
                            onClick={resend}
                            disabled={isResending}
                            className="text-foreground underline underline-offset-4 hover:text-primary disabled:opacity-50">
                            {isResending ? "Sending..." : "Resend code"}
                        </button>
                    )}
                </p>
                <p className="text-xs text-muted-foreground">Check your spam folder if it doesn&apos;t arrive.</p>
                <button
                    type="button"
                    onClick={onBack}
                    disabled={isVerifying}
                    className="underline underline-offset-4 hover:text-primary disabled:opacity-50">
                    Use a different email
                </button>
            </div>
        </div>
    );
}
