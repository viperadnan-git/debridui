import { NextRequest, NextResponse } from "next/server";
import { USER_AGENT } from "@/lib/constants";

const PREMIUMIZE_TOKEN_URL = "https://www.premiumize.me/token";

export async function POST(request: NextRequest) {
    const body = await request.text();

    const response = await fetch(PREMIUMIZE_TOKEN_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "User-Agent": USER_AGENT,
        },
        body,
    });

    const data = await response.text();
    return new NextResponse(data, {
        status: response.status,
        headers: {
            "Content-Type": response.headers.get("Content-Type") || "application/json",
        },
    });
}
