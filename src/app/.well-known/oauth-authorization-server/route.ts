import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const origin = new URL(req.url).origin;

    return NextResponse.json(
        {
            issuer: `${origin}/`,
            authorization_endpoint: `${origin}/oauth/authorize`,
            token_endpoint: `${origin}/api/oauth/token`,
            registration_endpoint: `${origin}/api/oauth/register`,
            response_types_supported: ["code"],
            grant_types_supported: ["authorization_code", "refresh_token"],
            code_challenge_methods_supported: ["S256"],
            token_endpoint_auth_methods_supported: ["client_secret_post", "none"],
            scopes_supported: ["openid", "profile", "email", "mcp"],
            subject_types_supported: ["public"],
            response_modes_supported: ["query"]
        },
        {
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type, Authorization",
                "Content-Type": "application/json"
            }
        }
    );
}

export async function OPTIONS() {
    return new NextResponse(null, {
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization"
        }
    });
}
