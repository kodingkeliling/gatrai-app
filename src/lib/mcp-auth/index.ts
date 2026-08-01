import { prisma } from "../prisma";
import crypto from "crypto";

export interface McpSession {
    userId: string;
    clientId: string;
}

/**
 * Validates a Bearer token or API key.
 * Returns the userId if valid, otherwise null.
 */
export async function validateMcpAuth(authHeader: string | null): Promise<string | null> {
    if (!authHeader) return null;

    const parts = authHeader.trim().split(" ");
    if (parts.length !== 2 || parts[0].toLowerCase() !== "bearer") {
        // Fallback check: treat the whole header as a raw API key if it's not bearer format
        const rawKey = authHeader.trim();
        const apiKeyRecord = await prisma.mcpApiKey.findFirst({
            where: {
                key: rawKey,
                OR: [
                    { expiresAt: null },
                    { expiresAt: { gt: new Date() } }
                ]
            }
        });
        if (apiKeyRecord) {
            return apiKeyRecord.userId;
        }
        return null;
    }

    const tokenValue = parts[1];

    // 1. Check in mcp_oauth_tokens
    const tokenRecord = await prisma.mcpOAuthToken.findFirst({
        where: {
            accessToken: tokenValue,
            OR: [
                { expiresAt: null },
                { expiresAt: { gt: new Date() } }
            ]
        }
    });

    if (tokenRecord) {
        return tokenRecord.userId;
    }

    // 2. Check as API key (fallback if passed inside Bearer format)
    const apiKeyRecord = await prisma.mcpApiKey.findFirst({
        where: {
            key: tokenValue,
            OR: [
                { expiresAt: null },
                { expiresAt: { gt: new Date() } }
            ]
        }
    });

    if (apiKeyRecord) {
        return apiKeyRecord.userId;
    }

    return null;
}

/**
 * Generates an authorization code valid for 10 minutes.
 */
export function generateAuthCode(): { code: string; expiresAt: Date } {
    const code = crypto.randomBytes(24).toString("hex");
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    return { code, expiresAt };
}

/**
 * Generates access and refresh tokens valid for 30 days.
 */
export function generateTokens(): { accessToken: string; refreshToken: string; expiresAt: Date } {
    const accessToken = crypto.randomBytes(32).toString("hex");
    const refreshToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    return { accessToken, refreshToken, expiresAt };
}
