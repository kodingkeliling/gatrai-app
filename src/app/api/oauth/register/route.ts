import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    let body: Record<string, unknown> = {};
    try {
        body = await req.json();
    } catch {
        // allow empty body
    }

    const redirectUris: string[] = Array.isArray(body.redirect_uris)
        ? (body.redirect_uris as string[])
        : [];

    const response = NextResponse.json(
        {
            client_id: "mcp-default-client",
            client_secret: undefined,
            client_id_issued_at: Math.floor(Date.now() / 1000),
            redirect_uris: redirectUris,
            token_endpoint_auth_method: "none",
            grant_types: ["authorization_code", "refresh_token"],
            response_types: ["code"],
            scope: "openid profile email mcp",
        },
        {
            status: 201,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type, Authorization"
            }
        }
    );

    return response;
}

export async function OPTIONS() {
    return new NextResponse(null, {
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization"
        }
    });
}

