import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AuthProvider } from "@/components/auth/auth-provider";
import { auth } from "@/lib/auth";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) redirect("/login");

    return <AuthProvider>{children}</AuthProvider>;
}
