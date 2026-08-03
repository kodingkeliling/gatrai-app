import { NextResponse, NextRequest } from "next/server";

export async function GET(req: NextRequest) {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const redirectUri = process.env.NEXT_PUBLIC_OAUTH_REDIRECT_URL;

    // Read the redirect param
    const searchParams = req.nextUrl.searchParams;
    const redirectTarget = searchParams.get("redirect");

    if (!clientId || !redirectUri) {
        return NextResponse.json({ error: "Google OAuth is not configured properly." }, { status: 500 });
    }

    const scope = "email profile";
    const responseType = "code";

    let authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(
        redirectUri
    )}&response_type=${responseType}&scope=${encodeURIComponent(scope)}&access_type=offline&prompt=consent`;

    if (redirectTarget) {
        authUrl += `&state=${encodeURIComponent(redirectTarget)}`;
    }

    return NextResponse.redirect(authUrl);
}
