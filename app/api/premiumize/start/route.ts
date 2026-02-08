import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const origin = new URL(request.url).origin;

    const clientId = process.env.PREMIUMIZE_CLIENT_ID;
    const authorizeUrl = process.env.PREMIUMIZE_OAUTH_AUTHORIZE_URL || "https://www.premiumize.me/oauth/authorize";
    const redirectUri = `${origin}/api/premiumize/callback`;

    if (!clientId) {
        return NextResponse.json({ error: "PREMIUMIZE_CLIENT_ID not configured" }, { status: 500 });
    }

    const state = Math.random().toString(36).slice(2);

    const url = new URL(authorizeUrl);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("client_id", clientId);
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("state", state);
    // Request offline access to get a refresh token if supported
    url.searchParams.set("scope", "offline");

    return NextResponse.json({ redirect_url: url.toString() });
}
