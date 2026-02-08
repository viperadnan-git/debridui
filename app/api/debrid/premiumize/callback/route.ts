import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { addUserAccount } from "@/lib/actions/user-accounts";
import PremiumizeClient from "@/lib/clients/premiumize";
import { AccountType } from "@/lib/types";

/**
 * OAuth Callback Handler for Premiumize Authorization Code Flow
 * Receives the authorization code from Premiumize redirect
 * Exchanges code for access token and stores account
 */
export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");

    // ============================================
    // HANDLE AUTHORIZATION ERRORS FROM PREMIUMIZE
    // ============================================
    if (error) {
        const errorMsg = errorDescription || error;
        console.error(`[Premiumize OAuth] Authorization error: ${errorMsg}`);

        // Redirect to accounts add page with error message
        return NextResponse.redirect(
            new URL(`/accounts/add?premiumize_error=${encodeURIComponent(errorMsg)}`, request.url)
        );
    }

    // ============================================
    // VALIDATE REQUIRED PARAMETERS
    // ============================================
    if (!code || !state) {
        console.error("[Premiumize OAuth] Missing code or state parameter");
        return NextResponse.redirect(
            new URL("/accounts/add?premiumize_error=" + encodeURIComponent("Invalid callback parameters"), request.url)
        );
    }

    try {
        // ============================================
        // CSRF PROTECTION: Validate State
        // ============================================
        const storedState = request.cookies.get("premiumize_oauth_state")?.value;

        if (!storedState) {
            console.error("[Premiumize OAuth] No stored state found - missing cookie");
            return NextResponse.redirect(
                new URL("/accounts/add?premiumize_error=" + encodeURIComponent("State cookie not found"), request.url)
            );
        }

        if (storedState !== state) {
            console.error(
                `[Premiumize OAuth] State mismatch - potential CSRF attack. Stored: ${storedState}, Received: ${state}`
            );
            return NextResponse.redirect(
                new URL(
                    "/accounts/add?premiumize_error=" +
                        encodeURIComponent("State validation failed - potential CSRF attack"),
                    request.url
                )
            );
        }

        // ============================================
        // VERIFY USER IS AUTHENTICATED
        // ============================================
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            console.warn("[Premiumize OAuth] No active session - redirecting to login");
            return NextResponse.redirect(new URL("/login", request.url));
        }

        // ============================================
        // EXCHANGE AUTHORIZATION CODE FOR ACCESS TOKEN
        // ============================================
        console.debug(`[Premiumize OAuth] Exchanging code for access token for user: ${session.user.id}`);

        let accessToken: string;
        try {
            accessToken = await PremiumizeClient.exchangeCodeForToken(code);
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : "Token exchange failed";
            console.error(`[Premiumize OAuth] Token exchange error: ${errorMsg}`);
            return NextResponse.redirect(
                new URL(`/accounts/add?premiumize_error=${encodeURIComponent(errorMsg)}`, request.url)
            );
        }

        // ============================================
        // VERIFY TOKEN BY FETCHING ACCOUNT INFO
        // ============================================
        console.debug("[Premiumize OAuth] Verifying token validity");

        let account;
        try {
            account = await PremiumizeClient.getUser(`Bearer ${accessToken}`);
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : "Token verification failed";
            console.error(`[Premiumize OAuth] Token verification error: ${errorMsg}`);
            return NextResponse.redirect(
                new URL(`/accounts/add?premiumize_error=${encodeURIComponent(errorMsg)}`, request.url)
            );
        }

        // ============================================
        // STORE ACCOUNT IN DATABASE
        // ============================================
        console.debug(`[Premiumize OAuth] Storing Premiumize account for user: ${session.user.id}`);

        try {
            await addUserAccount({
                type: AccountType.PREMIUMIZE,
                apiKey: `Bearer ${accessToken}`,
                name: account.name || `Premiumize ${account.id}`,
            });
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : "Failed to store account";
            console.error(`[Premiumize OAuth] Account storage error: ${errorMsg}`);
            return NextResponse.redirect(
                new URL(`/accounts/add?premiumize_error=${encodeURIComponent(errorMsg)}`, request.url)
            );
        }

        // ============================================
        // SUCCESS: REDIRECT TO ONBOARDING
        // ============================================
        console.info(`[Premiumize OAuth] Successfully connected account for user: ${session.user.id}`);

        // Clear state cookie and redirect with cache-invalidation flag
        // The _timestamp param forces React Query to refetch by invalidating its cache
        const dashboardUrl = new URL("/dashboard", request.url);
        dashboardUrl.searchParams.set("_account_added", "true");
        const response = NextResponse.redirect(dashboardUrl);
        response.cookies.delete("premiumize_oauth_state");

        return response;
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "Unknown error";
        console.error(`[Premiumize OAuth] Unexpected error: ${errorMsg}`, error);
        return NextResponse.redirect(
            new URL(`/accounts/add?premiumize_error=${encodeURIComponent("Unexpected error occurred")}`, request.url)
        );
    }
}

/**
 * Optional POST handler for client-side token exchange
 * If frontend wants to handle token exchange client-side (less recommended)
 */
export async function POST(request: NextRequest) {
    try {
        const { code, state } = await request.json();

        if (!code || !state) {
            return NextResponse.json({ error: "Missing code or state" }, { status: 400 });
        }

        // Validate state
        const storedState = request.cookies.get("premiumize_oauth_state")?.value;
        if (!storedState || storedState !== state) {
            return NextResponse.json({ error: "State validation failed" }, { status: 400 });
        }

        // Exchange code for token
        let accessToken: string;
        try {
            accessToken = await PremiumizeClient.exchangeCodeForToken(code);
        } catch (error) {
            return NextResponse.json(
                { error: error instanceof Error ? error.message : "Token exchange failed" },
                { status: 400 }
            );
        }

        return NextResponse.json({ apiKey: `Bearer ${accessToken}` });
    } catch (error) {
        console.error("[Premiumize OAuth] POST handler error:", error);
        return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
}
