import { emailOTPClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
    plugins: [emailOTPClient()],
    fetchOptions: {
        onError(context) {
            // Coded 4xx errors are expected outcomes callers show in their UI
            if (context.response.status < 500 && context.error.code) return;
            console.error("Better Auth Error:", context.error);
        },
    },
    // Disable automatic refetching of session, to prevent unnecessary network requests
    sessionOptions: {
        refetchOnWindowFocus: false,
    },
});
