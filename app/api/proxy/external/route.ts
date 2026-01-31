import { NextRequest, NextResponse } from "next/server";

const MAX_REDIRECTS = 10;

async function resolveRedirects(url: string): Promise<string> {
    let currentUrl = url;
    for (let i = 0; i < MAX_REDIRECTS; i++) {
        const response = await fetch(currentUrl, {
            method: "HEAD",
            redirect: "manual",
        });
        if (response.status >= 300 && response.status < 400) {
            const location = response.headers.get("location");
            if (!location) break;
            // Handle relative redirects
            currentUrl = new URL(location, currentUrl).href;
        } else {
            break;
        }
    }
    return currentUrl;
}

export async function GET(request: NextRequest) {
    const url = request.nextUrl.searchParams.get("url");
    if (!url) {
        return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
    }

    try {
        // Resolve redirects without downloading content
        const resolve = request.nextUrl.searchParams.get("resolve") === "true";
        if (resolve) {
            const resolvedUrl = await resolveRedirects(url);
            return NextResponse.json({ resolvedUrl });
        }

        const method = request.nextUrl.searchParams.get("method") || "GET";
        const response = await fetch(url, {
            method,
            redirect: "follow",
        });

        // For HEAD requests, return headers as JSON
        if (method === "HEAD") {
            return NextResponse.json({
                contentType: response.headers.get("content-type"),
                contentLength: response.headers.get("content-length"),
                status: response.status,
            });
        }

        // For GET requests (downloading torrent files), stream the response
        return new NextResponse(response.body, {
            status: response.status,
            headers: {
                "content-type": response.headers.get("content-type") || "application/octet-stream",
            },
        });
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Fetch failed" },
            { status: 500 }
        );
    }
}
