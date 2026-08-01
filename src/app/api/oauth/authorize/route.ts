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

        // Generate the code and expiration
        const { code, expiresAt } = generateAuthCode();

        // Create or update active token for the user/client
        await prisma.mcpOAuthToken.upsert({
            where: {
                code: code // code is unique, it's safe
            },
            create: {
                userId,
                code,
                codeChallenge: codeChallenge || null,
                codeChallengeMethod: codeChallengeMethod || null,
                clientId: cleanClientId,
                expiresAt
            },
            update: {
                userId,
                code,
                codeChallenge: codeChallenge || null,
                codeChallengeMethod: codeChallengeMethod || null,
                clientId: cleanClientId,
                expiresAt
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
        console.error("Authorization Error:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
