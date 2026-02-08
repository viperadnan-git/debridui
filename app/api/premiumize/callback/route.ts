async function exchangeCodeForToken(code: string, redirectUri: string) {
    const tokenUrl = process.env.PREMIUMIZE_OAUTH_TOKEN_URL || "https://www.premiumize.me/oauth/token";
    const clientId = process.env.NEXT_PUBLIC_PREMIUMIZE_CLIENT_ID;
    const clientSecret = process.env.PREMIUMIZE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        throw new Error("OAuth client credentials not configured");
    }

    const params = new URLSearchParams();
    params.append("grant_type", "authorization_code");
    params.append("code", code);
    params.append("redirect_uri", redirectUri);
    params.append("client_id", clientId);
    params.append("client_secret", clientSecret);

    const res = await fetch(tokenUrl, {
        method: "POST",
        body: params,
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Token exchange failed: ${text}`);
    }

    return res.json();
}

export async function GET(request: Request) {
    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const origin = url.origin;

    const redirectUri = `${origin}/api/premiumize/callback`;

    if (!code) {
        return new Response("Missing code", { status: 400 });
    }

    try {
        const tokenResponse = await exchangeCodeForToken(code, redirectUri);

        const accessToken = tokenResponse.access_token || tokenResponse.token || tokenResponse.apikey || null;

        const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Premiumize OAuth</title>
  </head>
  <body>
    <script>
      (function(){
        try {
          const payload = { provider: 'premiumize', apiKey: ${JSON.stringify(accessToken)}, state: ${JSON.stringify(state)} };
          if (window.opener && !window.opener.closed) {
            window.opener.postMessage(payload, window.location.origin);
            window.close();
          } else {
            document.body.innerText = payload.apiKey || 'Authentication completed. You may close this window.';
          }
        } catch (e) {
          document.body.innerText = 'Authentication failed';
        }
      })();
    </script>
  </body>
</html>`;

        return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
    } catch (err) {
        const message = (err instanceof Error && err.message) || "OAuth token exchange failed";
        return new Response(message, { status: 500 });
    }
}
