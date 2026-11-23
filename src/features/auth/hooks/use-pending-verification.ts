"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";

/** Email awaiting its verification code, kept in `?verify=` so the code step survives a refresh. */
export function usePendingVerification() {
    const searchParams = useSearchParams();
    // Only true when this page just sent a code; a refreshed `?verify=` URL has no fresh send to wait on
    const [codeJustSent, setCodeJustSent] = useState(false);

    function setPendingEmail(email: string | null, { codeSent = true } = {}) {
        const params = new URLSearchParams(searchParams);
        if (email) params.set("verify", email);
        else params.delete("verify");
        // Shallow update: syncs useSearchParams without re-running the server page
        window.history.replaceState(null, "", params.size ? `?${params}` : window.location.pathname);
        setCodeJustSent(!!email && codeSent);
    }

    return { pendingEmail: searchParams.get("verify"), setPendingEmail, codeJustSent };
}
