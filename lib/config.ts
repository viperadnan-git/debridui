/**
 * Client-side configuration
 * Note: Only NEXT_PUBLIC_ env vars are available on the client
 */

export const config = {
    isGoogleOAuthEnabled: !!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
} as const;
