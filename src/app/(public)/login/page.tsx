import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { auth, isEmailEnabled } from "@/lib/auth";
import LoginForm from "./_components/login-form";

export default async function LoginPage() {
    const session = await auth.api.getSession({ headers: await headers() });
    if (session) redirect("/dashboard");

    return (
        <Suspense fallback={null}>
            <LoginForm canResetPassword={isEmailEnabled} />
        </Suspense>
    );
}
