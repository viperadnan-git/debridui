import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { auth, isEmailEnabled } from "@/lib/auth";
import ForgotPasswordForm from "./_components/forgot-password-form";

export default async function ForgotPasswordPage() {
    // SMTP is runtime config; without this the check would be baked in at build time
    await connection();
    // Reset codes go out by email, so the page only exists when SMTP is configured
    if (!isEmailEnabled) redirect("/login");
    const session = await auth.api.getSession({ headers: await headers() });
    if (session) redirect("/dashboard");

    return (
        <Suspense fallback={null}>
            <ForgotPasswordForm />
        </Suspense>
    );
}
