"use client";

import { useState } from "react";
import Link from "next/link";
import { Key01, Mail01, ArrowLeft } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { Form } from "@/components/base/form/form";
import { Input } from "@/components/base/input/input";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { BackgroundPattern } from "@/components/shared-assets/background-patterns";
import { AuthLayout } from "@/components/auth/auth-layout";

export const ForgotPasswordPage = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [sent, setSent] = useState(false);
    const [sentEmail, setSentEmail] = useState<string>("");
    const [devToken, setDevToken] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        const formData = new FormData(e.currentTarget);
        const email = formData.get("email") as string;

        try {
            const res = await fetch("/api/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error ?? "Something went wrong");
                return;
            }

            setSent(true);
            setSentEmail(email);
            if (data.resetToken) {
                setDevToken(data.resetToken);
            }
        } catch {
            setError("An unexpected error occurred. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleResend = () => {
        setSent(false);
        setDevToken(null);
    };

    return (
        <AuthLayout>
            {sent ? (
                <>
                    <div className="flex flex-col items-center gap-6 text-center">
                        <div className="relative">
                            <FeaturedIcon color="gray" theme="modern" size="xl" className="z-10">
                                <Mail01 className="size-7" />
                            </FeaturedIcon>
                            <BackgroundPattern size="lg" pattern="grid" className="absolute top-1/2 left-1/2 z-0 hidden -translate-x-1/2 -translate-y-1/2 md:block" />
                            <BackgroundPattern size="md" pattern="grid" className="absolute top-1/2 left-1/2 z-0 -translate-x-1/2 -translate-y-1/2 md:hidden" />
                        </div>

                        <div className="z-10 flex flex-col gap-2 md:gap-3">
                            <h1 className="text-display-xs font-semibold text-primary md:text-display-sm">
                                Cek email Anda
                            </h1>
                            <p className="text-md text-tertiary">
                                Kami telah mengirim link reset password ke{" "}
                                <span className="font-semibold text-primary">{sentEmail}</span>
                            </p>
                        </div>
                    </div>

                    {devToken && (
                        <div className="z-10 rounded-xl border border-warning-200 bg-warning-50 p-4 dark:border-warning-800 dark:bg-warning-900/20">
                            <p className="mb-2 text-xs font-semibold text-warning-700 dark:text-warning-400">
                                🔧 Dev Mode – Reset Token:
                            </p>
                            <Link
                                href={`/reset-password?token=${devToken}`}
                                className="break-all text-xs text-brand-600 hover:underline"
                            >
                                /reset-password?token={devToken}
                            </Link>
                        </div>
                    )}

                    <div className="z-10 flex flex-col items-center gap-6 text-center">
                        <p className="flex flex-wrap justify-center gap-1 text-sm text-tertiary">
                            Tidak menerima email?{" "}
                            <Button color="link-color" size="sm" onClick={handleResend} className="font-semibold">
                                Klik untuk kirim ulang
                            </Button>
                        </p>
                        <Link
                            href="/login"
                            className="flex items-center gap-2 text-sm font-semibold text-tertiary hover:text-primary transition-colors"
                        >
                            <ArrowLeft className="size-4" />
                            Kembali ke Login
                        </Link>
                    </div>
                </>
            ) : (
                <>
                    <div className="flex flex-col items-center gap-6 text-center">
                        <div className="relative">
                            <FeaturedIcon color="gray" theme="modern" size="xl" className="z-10">
                                <Key01 className="size-7" />
                            </FeaturedIcon>
                            <BackgroundPattern size="lg" pattern="grid" className="absolute top-1/2 left-1/2 z-0 hidden -translate-x-1/2 -translate-y-1/2 md:block" />
                            <BackgroundPattern size="md" pattern="grid" className="absolute top-1/2 left-1/2 z-0 -translate-x-1/2 -translate-y-1/2 md:hidden" />
                        </div>

                        <div className="z-10 flex flex-col gap-2 md:gap-3">
                            <h1 className="text-display-xs font-semibold text-primary md:text-display-sm">
                                Lupa Password?
                            </h1>
                            <p className="text-md text-tertiary">
                                Tenang, kami akan kirimkan instruksi reset password ke email Anda.
                            </p>
                        </div>
                    </div>

                    <Form onSubmit={handleSubmit} className="z-10 flex flex-col gap-6">
                        <Input
                            isRequired
                            hideRequiredIndicator
                            label="Email"
                            type="email"
                            name="email"
                            placeholder="Masukkan email Anda"
                            size="md"
                        />

                        {error && (
                            <p className="text-sm font-medium text-red-600">{error}</p>
                        )}

                        <Button type="submit" size="lg" isLoading={isLoading} disabled={isLoading}>
                            Reset Password
                        </Button>
                    </Form>

                    <div className="relative z-10 flex justify-center text-center">
                        <Link
                            href="/login"
                            className="flex items-center gap-2 text-sm font-semibold text-tertiary hover:text-primary transition-colors"
                        >
                            <ArrowLeft className="size-4" />
                            Kembali ke Login
                        </Link>
                    </div>
                </>
            )}
        </AuthLayout>
    );
};
