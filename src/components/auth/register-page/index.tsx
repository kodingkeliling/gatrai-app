"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Mail01 } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { GoogleAuthButton } from "@/components/auth/google-auth-button";
import { Form } from "@/components/base/form/form";
import { Input } from "@/components/base/input/input";
import { BackgroundPattern } from "@/components/shared-assets/background-patterns";
import { useAuthStore } from "@/store/use-auth-store";
import { AuthLayout } from "@/components/auth/auth-layout";
import { cx } from "@/utils/cx";

export const RegisterPage = () => {
    const router = useRouter();
    const setUser = useAuthStore((state) => state.setUser);

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [password, setPassword] = useState("");
    const [emailSent, setEmailSent] = useState(false);
    const [submittedEmail, setSubmittedEmail] = useState("");
    const [resendCountdown, setResendCountdown] = useState(60);

    useEffect(() => {
        if (emailSent && resendCountdown > 0) {
            const timer = setInterval(() => {
                setResendCountdown((prev) => prev - 1);
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [emailSent, resendCountdown]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        const formData = new FormData(e.currentTarget);
        const name = formData.get("name") as string;
        const email = formData.get("email") as string;
        const pwd = formData.get("password") as string;

        try {
            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name,
                    email,
                    password: pwd,
                    role: "STUDENT",
                }),
            });

            const data = await res.json();

            // Genuine validation errors (missing fields, etc.)
            if (res.status === 400) {
                setError(data.error ?? "Terjadi kesalahan. Silakan coba lagi.");
                return;
            }

            // Registration succeeded (201) or email already exists (200 — silent)
            // Either way, show the "check your email" screen
            if (data.emailSent) {
                setSubmittedEmail(email);
                setEmailSent(true);

                // If a real user was returned (new account), store in auth state
                if (data.user) {
                    setUser(data.user);
                }
                return;
            }

            // Fallback: something unexpected — redirect based on role
            if (data.user) {
                setUser(data.user);
                router.push(data.user.role === "STUDENT" ? "/playground" : "/dashboard");
            }
        } catch {
            setError("Terjadi kesalahan. Silakan coba lagi.");
        } finally {
            setIsLoading(false);
        }
    };

    // ── Email sent success screen ─────────────────────────────────────────────
    if (emailSent) {
        return (
            <AuthLayout>
                <div className="flex flex-col items-center gap-6 text-center">
                    <div className="relative flex items-center justify-center">
                        <BackgroundPattern
                            pattern="grid"
                            className="absolute z-0 hidden md:block" // centering logic might need adjustment but parent is relative and flex-center
                            style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
                        />
                        <BackgroundPattern
                            pattern="grid"
                            size="md"
                            className="absolute z-0 md:hidden"
                            style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
                        />
                        <div className="relative z-10 flex size-16 items-center justify-center rounded-full bg-brand-50 dark:bg-brand-950/30">
                            <Mail01 className="size-8 text-brand-600" />
                        </div>
                    </div>
                    <div className="z-10 flex flex-col gap-2">
                        <h1 className="text-display-xs font-semibold text-primary">
                            Cek email Anda
                        </h1>
                        <p className="text-md text-tertiary">
                            Kami telah mengirimkan tautan aktivasi akun ke{" "}
                            <span className="font-semibold text-primary">{submittedEmail}</span>.
                            Tautan ini berlaku selama <span className="font-semibold text-primary">5 menit</span>.
                            Silakan cek inbox atau folder spam Anda.
                        </p>
                    </div>
                </div>

                <div className="z-10 rounded-xl border border-brand-200 bg-brand-50 p-4 dark:border-brand-800 dark:bg-brand-950/20">
                    <p className="text-sm text-brand-700 dark:text-brand-400">
                        Jika tidak menerima email dalam beberapa menit, coba periksa folder spam atau minta ulang tautan di bawah.
                    </p>
                </div>

                <div className="z-10 flex flex-col gap-3">
                    <Button
                        size="lg"
                        color="secondary"
                        onClick={async () => {
                            if (resendCountdown > 0) return;
                            try {
                                setResendCountdown(60);
                                await fetch("/api/auth/resend", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ email: submittedEmail }),
                                });
                            } catch (e) {
                                console.error(e);
                            }
                        }}
                        disabled={resendCountdown > 0}
                    >
                        {resendCountdown > 0
                            ? `Kirim Ulang Email (${resendCountdown}s)`
                            : "Kirim Ulang Email"}
                    </Button>
                    <Button
                        size="lg"
                        onClick={() => router.push("/login")}
                    >
                        Masuk ke Akun
                    </Button>
                </div>

                <div className="z-10 flex justify-center mt-2">
                    <button
                        onClick={() => { setEmailSent(false); setError(null); }}
                        className="text-sm font-semibold text-tertiary hover:text-primary transition-colors"
                    >
                        ← Daftar dengan email lain
                    </button>
                </div>
            </AuthLayout>
        );
    }

    // ── Registration form ─────────────────────────────────────────────────────
    return (
        <AuthLayout>
            {/* Logo + Title */}
            <div className="flex flex-col items-center gap-6 text-center">
                <div className="relative">
                    <BackgroundPattern
                        pattern="grid"
                        className="absolute top-1/2 left-1/2 z-0 hidden -translate-x-1/2 -translate-y-1/2 md:block"
                    />
                    <BackgroundPattern
                        pattern="grid"
                        size="md"
                        className="absolute top-1/2 left-1/2 z-0 -translate-x-1/2 -translate-y-1/2 md:hidden"
                    />
                    <Image
                        src="/logo.png"
                        alt="Logo"
                        width={48}
                        height={48}
                        className="relative z-10 object-contain"
                    />
                </div>
                <div className="z-10 flex flex-col gap-2 md:gap-3">
                    <h1 className="text-display-xs font-semibold text-primary md:text-display-sm">
                        Mulai Latihan Bahasa
                    </h1>
                    <p className="text-md text-tertiary">
                        Daftar gratis dan mulai latihan soal bahasa asing dengan AI — English, Japanese, Korean & lebih banyak lagi.
                    </p>
                </div>
            </div>

            {/* Form */}
            <Form onSubmit={handleSubmit} className="relative z-10 flex flex-col gap-6">
                <div className="flex flex-col gap-5">
                    <Input
                        isRequired
                        hideRequiredIndicator
                        label="Nama Lengkap"
                        name="name"
                        placeholder="Masukkan nama lengkap"
                        size="md"
                    />
                    <Input
                        isRequired
                        hideRequiredIndicator
                        label="Email"
                        type="email"
                        name="email"
                        placeholder="Masukkan email"
                        size="md"
                    />
                    <Input
                        isRequired
                        hideRequiredIndicator
                        label="Password"
                        type="password"
                        name="password"
                        size="md"
                        placeholder="Min. 8 karakter"
                        minLength={8}
                        hint="Minimal 8 karakter."
                        onChange={setPassword}
                    />

                    {/* Password strength indicators */}
                    <div className="flex flex-col gap-2">
                        <span className="flex items-center gap-2">
                            <div className={cx(
                                "flex size-4 items-center justify-center rounded-full bg-fg-disabled_subtle text-fg-white transition-all duration-150",
                                password.length >= 8 ? "bg-fg-success-primary" : ""
                            )}>
                                <svg width="8" height="7" viewBox="0 0 10 8" fill="none">
                                    <path d="M1.25 4L3.75 6.5L8.75 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                            <p className="text-xs text-tertiary">Minimal 8 karakter</p>
                        </span>
                        <span className="flex items-center gap-2">
                            <div className={cx(
                                "flex size-4 items-center justify-center rounded-full bg-fg-disabled_subtle text-fg-white transition-all duration-150",
                                password.match(/[!@#$%^&*(),.?":{}|<>]/) ? "bg-fg-success-primary" : ""
                            )}>
                                <svg width="8" height="7" viewBox="0 0 10 8" fill="none">
                                    <path d="M1.25 4L3.75 6.5L8.75 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                            <p className="text-xs text-tertiary">Mengandung karakter spesial</p>
                        </span>
                    </div>
                </div>

                {error && (
                    <p className="text-sm font-medium text-red-600">{error}</p>
                )}

                <Button
                    type="submit"
                    size="lg"
                    isLoading={isLoading}
                    disabled={isLoading}
                >
                    Daftar Sekarang
                </Button>

                <GoogleAuthButton />
            </Form>

            <div className="relative z-10 flex justify-center gap-1 text-center">
                <span className="text-sm text-tertiary">Sudah punya akun?</span>
                <Link
                    href="/login"
                    className="text-sm font-semibold text-brand-700 hover:text-brand-800"
                >
                    Masuk
                </Link>
            </div>
        </AuthLayout>
    );
};
