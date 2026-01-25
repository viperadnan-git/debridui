import { createAuthClient } from "better-auth/react";

// `client-swr-dedup` - Disable unnecessary refetching with cookie cache enabled
export const authClient = createAuthClient({
    fetchOptions: {
        onError(context) {
            console.error("Better Auth Error:", context.error);
        },
    },
});
