"use client";

import { useRouter } from "next/navigation";
import { UserPlus } from "lucide-react";
import { LoginForm } from "@/components/login-form";
import { PageHeader } from "@/components/page-header";

export default function AddAccountPage() {
    const router = useRouter();

    const handleSuccess = () => {
        router.push("/accounts");
    };

    return (
        <div className="mx-auto w-full max-w-5xl space-y-8 pb-16">
            <PageHeader icon={UserPlus} title="Add Account" description="Connect a new debrid service account" />

            <div className="max-w-md mx-auto">
                <LoginForm
                    showBranding={false}
                    showOAuthButtons={true}
                    showTerms={false}
                    submitButtonText="Add Account"
                    onSuccess={handleSuccess}
                    disableAutoRedirect={true}
                />
            </div>
        </div>
    );
}
