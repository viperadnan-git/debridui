import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import SignupForm from "./signup-form";

export default async function SignupPage() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (session) {
        redirect("/dashboard");
    }

    return <SignupForm />;
}
