import { NextRequest, NextResponse } from "next/server";
import { requestPasswordReset } from "@/api/auth";
import { sendEmail } from "@/lib/send-email";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { email } = body;

        if (!email) {
            return NextResponse.json({ error: "Email is required" }, { status: 400 });
        }

        const { resetToken } = await requestPasswordReset(email);

        // Send email if a token was generated (i.e. the email exists in our DB)
        if (resetToken) {
            const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://gatrai.kodingkeliling.com";
            const resetLink = `${appUrl}/reset-password?token=${resetToken}`;

            await sendEmail({
                to: email,
                subject: "Reset Password GatrAI",
                title: "Reset Password",
                name: email,
                message: `Kami menerima permintaan untuk mereset password akun GatrAI Anda. Klik link di bawah ini untuk membuat password baru. Link ini berlaku selama 1 jam.`,
                actionLink: resetLink,
            });
        }

        const isDev = process.env.NODE_ENV !== "production";
        return NextResponse.json(
            {
                message: "If that email exists, a reset link has been sent.",
                ...(isDev && resetToken ? { resetToken } : {}),
            },
            { status: 200 }
        );
    } catch (error) {
        const message = error instanceof Error ? error.message : "Internal server error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
