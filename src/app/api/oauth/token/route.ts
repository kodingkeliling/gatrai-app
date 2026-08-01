import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateTokens } from "@/lib/mcp-auth";
import crypto from "crypto";

// Helper to base64url-encode a buffer
function base64url(buffer: Buffer): string {
    return buffer.toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=/g, "");
}

// Verify S256 challenge
function verifyPkce(verifier: string, challenge: string): boolean {
    const hash = crypto.createHash("sha256").update(verifier).digest();
    const calculatedChallenge = base64url(hash);
    return calculatedChallenge === challenge;
}

export async function POST(req: NextRequest) {
    try {
        let body: any = {};
        const contentType = req.headers.get("content-type") || "";

        if (contentType.includes("application/x-www-form-urlencoded")) {
            const formData = await req.formData();
            formData.forEach((value, key) => {
                body[key] = value.toString();
            });
        } else {
            body = await req.json().catch(() => ({}));
        }

        const {
            grant_type,
            code,
            redirect_uri,
            client_id,
            code_verifier,
            refresh_token
        } = body;

        if (grant_type === "authorization_code") {
            if (!code) {
                return NextResponse.json({ error: "invalid_request", error_description: "Missing code" }, { status: 400 });
            }

            const tokenRecord = await prisma.mcpOAuthToken.findUnique({
                where: { code }
            });

            if (!tokenRecord) {
                return NextResponse.json({ error: "invalid_grant", error_description: "Invalid authorization code" }, { status: 400 });
            }

            if (tokenRecord.expiresAt && tokenRecord.expiresAt < new Date()) {
                return NextResponse.json({ error: "invalid_grant", error_description: "Authorization code expired" }, { status: 400 });
            }

            // Verify PKCE if configured
            if (tokenRecord.codeChallenge) {
                if (!code_verifier) {
                    return NextResponse.json({ error: "invalid_grant", error_description: "Missing code_verifier" }, { status: 400 });
                }

                const isChallengeValid = verifyPkce(code_verifier, tokenRecord.codeChallenge);
                if (!isChallengeValid) {
                    return NextResponse.json({ error: "invalid_grant", error_description: "PKCE verification failed" }, { status: 400 });
                }
            }

            // Generate access token & refresh token
            const tokens = generateTokens();

            // Rotate tokens and invalidate code
            await prisma.mcpOAuthToken.update({
                where: { id: tokenRecord.id },
                data: {
                    code: null, // consume the authorization code
                    accessToken: tokens.accessToken,
                    refreshToken: tokens.refreshToken,
                    expiresAt: tokens.expiresAt
                }
            });

            return NextResponse.json(
                {
                    access_token: tokens.accessToken,
                    token_type: "Bearer",
                    expires_in: 30 * 24 * 60 * 60, // 30 days in seconds
                    refresh_token: tokens.refreshToken,
                    scope: "mcp"
                },
                {
                    headers: {
                        "Access-Control-Allow-Origin": "*",
                        "Access-Control-Allow-Methods": "POST, OPTIONS",
                        "Access-Control-Allow-Headers": "Content-Type, Authorization"
                    }
                }
            );
        } else if (grant_type === "refresh_token") {
            if (!refresh_token) {
                return NextResponse.json({ error: "invalid_request", error_description: "Missing refresh_token" }, { status: 400 });
            }

            const tokenRecord = await prisma.mcpOAuthToken.findUnique({
                where: { refreshToken: refresh_token }
            });

            if (!tokenRecord) {
                return NextResponse.json({ error: "invalid_grant", error_description: "Invalid refresh token" }, { status: 400 });
            }

            const tokens = generateTokens();

            await prisma.mcpOAuthToken.update({
                where: { id: tokenRecord.id },
                data: {
                    accessToken: tokens.accessToken,
                    refreshToken: tokens.refreshToken,
                    expiresAt: tokens.expiresAt
                }
            });

            return NextResponse.json(
                {
                    access_token: tokens.accessToken,
                    token_type: "Bearer",
                    expires_in: 30 * 24 * 60 * 60,
                    refresh_token: tokens.refreshToken,
                    scope: "mcp"
                },
                {
                    headers: {
                        "Access-Control-Allow-Origin": "*",
                        "Access-Control-Allow-Methods": "POST, OPTIONS",
                        "Access-Control-Allow-Headers": "Content-Type, Authorization"
                    }
                }
            );
        }

        return NextResponse.json({ error: "unsupported_grant_type" }, { status: 400 });
    } catch (err: any) {
        console.error("Token Exchange Error:", err);
        return NextResponse.json({ error: "server_error" }, { status: 500 });
    }
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
