import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateAuthCode } from "@/lib/mcp-auth";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const {
            userId,
            clientId,
            redirectUri,
            responseType,
            state,
            codeChallenge,
            codeChallengeMethod
        } = body;

        if (!userId) {
            return NextResponse.json({ error: "User ID is required" }, { status: 400 });
        }

        const cleanClientId = clientId || "mcp-default-client";

        // Remove any stale pending codes (no accessToken yet) for this user+client to keep DB clean
        await prisma.mcpOAuthToken.deleteMany({
            where: {
                userId,
                clientId: cleanClientId,
                accessToken: null,
                code: { not: null },
            }
        });

        // Generate a fresh auth code
        const { code, expiresAt } = generateAuthCode();

        // Always create — the freshly generated code is guaranteed unique
        await prisma.mcpOAuthToken.create({
            data: {
                userId,
                code,
                codeChallenge: codeChallenge || null,
                codeChallengeMethod: codeChallengeMethod || null,
                clientId: cleanClientId,
                expiresAt,
            }
        });

        // Build callback redirect url
        if (redirectUri) {
            const redirectUrl = new URL(redirectUri);
            redirectUrl.searchParams.set("code", code);
            if (state) {
                redirectUrl.searchParams.set("state", state);
            }
            return NextResponse.json({ redirectUrl: redirectUrl.toString() });
        }

        return NextResponse.json({ code });
    } catch (err: any) {
        return NextResponse.json({ error: err.message || "Internal server error", stack: err.stack }, { status: 500 });
    }
}
