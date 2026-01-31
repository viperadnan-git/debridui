import { NextRequest, NextResponse } from "next/server";
import { USER_AGENT } from "@/lib/constants";

const PREMIUMIZE_API_BASE = "https://www.premiumize.me/api";

async function proxyRequest(request: NextRequest, params: Promise<{ path: string[] }>) {
    const { path } = await params;
    const apiKey = request.headers.get("X-Premiumize-Key");

    if (!apiKey) {
        return NextResponse.json({ status: "error", message: "Missing API key" }, { status: 401 });
    }

    const pathStr = path.join("/");
    const url = new URL(request.url);
    const targetUrl = `${PREMIUMIZE_API_BASE}/${pathStr}${url.search}`;

    const authHeader: Record<string, string> = {};
    if (apiKey.includes("Bearer")) {
        authHeader["Authorization"] = apiKey;
    } else {
        authHeader["Cookie"] = `sdk_login=${apiKey}; cookieNoticeSeen=1`;
    }

    const headers: HeadersInit = {
        "User-Agent": USER_AGENT,
        ...authHeader,
    };

    const contentType = request.headers.get("Content-Type");
    if (contentType) {
        headers["Content-Type"] = contentType;
    }

    const response = await fetch(targetUrl, {
        method: request.method,
        headers,
        body: request.method !== "GET" && request.method !== "HEAD" ? await request.arrayBuffer() : undefined,
    });

    const data = await response.text();
    return new NextResponse(data, {
        status: response.status,
        headers: {
            "Content-Type": response.headers.get("Content-Type") || "application/json",
        },
    });
}

export async function GET(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
    return proxyRequest(request, context.params);
}

export async function POST(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
    return proxyRequest(request, context.params);
}
