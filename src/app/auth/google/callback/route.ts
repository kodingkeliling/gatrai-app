import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import crypto from "crypto";

const JWT_SECRET = process.env.JWT_SECRET ?? "fraise-secret-key-change-in-production";

export async function GET(req: NextRequest) {
    const code = req.nextUrl.searchParams.get("code");

    if (!code) {
        return NextResponse.redirect(new URL("/login?error=OauthCodeMissing", req.url));
    }

    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const clientSecret = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.NEXT_PUBLIC_OAUTH_REDIRECT_URL;

    if (!clientId || !clientSecret || !redirectUri) {
        return NextResponse.redirect(new URL("/login?error=ConfigurationError", req.url));
    }

    try {
        // Exchange code for tokens
        const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                code,
                client_id: clientId,
                client_secret: clientSecret,
                redirect_uri: redirectUri,
                grant_type: "authorization_code",
            }),
        });

        const tokenData = await tokenResponse.json();

        if (tokenData.error) {
            console.error("OAuth token exchange error:", tokenData);
            return NextResponse.redirect(new URL("/login?error=OauthExchangeFailed", req.url));
        }

        // Get user info
        const userResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
            headers: {
                Authorization: `Bearer ${tokenData.access_token}`,
            },
        });

        const userData = await userResponse.json();

        if (!userData.email) {
            return NextResponse.redirect(new URL("/login?error=OauthEmailMissing", req.url));
        }

        // Find or create user
        let user = await prisma.user.findUnique({
            where: { email: userData.email },
        });

        if (!user) {
            // Generate dummy password hash for OAuth users
            const dummyPassword = crypto.randomBytes(32).toString("hex");
            // Usually we hash it, but a random 64 char hex is safe enough for a dummy passwordHash
            
            user = await prisma.user.create({
                data: {
                    email: userData.email,
                    name: userData.name || "Google User",
                    passwordHash: dummyPassword,
                    role: "USER",
                    isVerified: true, // Google emails are pre-verified
                },
            });
        }

        // Generate JWT
        const authUser = {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            planId: user.planId ?? null,
        };

        const token = jwt.sign(authUser, JWT_SECRET, { expiresIn: "7d" });

        // Set cookie and redirect
        const res = NextResponse.redirect(new URL("/dashboard", req.url));
        res.cookies.set("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60, // 7 days
            path: "/",
        });

        return res;
    } catch (error) {
        console.error("Google OAuth callback error:", error);
        return NextResponse.redirect(new URL("/login?error=OauthServerFailed", req.url));
    }
}
