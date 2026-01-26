"use client";

import { UserPlus } from "lucide-react";
import { AddAccountForm } from "@/components/add-account-form";
import { PageHeader } from "@/components/page-header";

export default function AddAccountPage() {
    return (
        <div className="mx-auto w-full max-w-5xl space-y-8 pb-16">
            <PageHeader icon={UserPlus} title="Add Account" description="Connect a new debrid service account" />

            <div className="max-w-md mx-auto">
                <AddAccountForm />
            </div>
        </div>
    );
}
