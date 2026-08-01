"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Check, AlertCircle } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { GoogleAuthButton } from "@/components/auth/google-auth-button";
import { Form } from "@/components/base/form/form";
import { Input } from "@/components/base/input/input";
import { BackgroundPattern } from "@/components/shared-assets/background-patterns";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { AlertFloating } from "@/components/application/alerts/alerts";
import { useAuthStore } from "@/store/use-auth-store";
import { AuthLayout } from "@/components/auth/auth-layout";
import { APP_NAME } from "@/config";

export const LoginPage = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const setUser = useAuthStore((state) => state.setUser);

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const resetSuccess = searchParams.get("reset") === "success";
    const redirectParam = searchParams.get("redirect");
    const isVerified = searchParams.get("verified") === "true";
    const urlError = searchParams.get("error");
    const isVerificationError = urlError && urlError.toLowerCase().includes("verifi");

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        const formData = new FormData(e.currentTarget);
        const email = formData.get("email") as string;
        const password = formData.get("password") as string;

        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error ?? "Login gagal. Periksa email dan password Anda.");
                return;
            }

            setUser(data.user);

            // SUPER_ADMIN goes to dashboard; USER falls back to redirect param or home
            const role = data.user?.role;
            if (role === "SUPER_ADMIN") {
                router.push(redirectParam ?? "/dashboard");
            } else {
                router.push(redirectParam ?? "/playground");
            }
        } catch {
            setError("Terjadi kesalahan. Silakan coba lagi.");
        } finally {
            setIsLoading(false);
        }
    };

    // ── Validation Success Screen ─────────────────────────────────────────────
    if (isVerified) {
        return (
            <AuthLayout>
                <div className="flex flex-col items-center gap-6 text-center">
                    <div className="relative flex items-center justify-center">
                        <BackgroundPattern
                            pattern="grid"
                            className="absolute z-0 hidden md:block"
                            style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
                        />
                        <BackgroundPattern
                            pattern="grid"
                            size="md"
                            className="absolute z-0 md:hidden"
                            style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
                        />
                        <FeaturedIcon icon={Check} color="success" theme="light" size="xl" className="z-10" />
                    </div>
                    <div className="z-10 flex flex-col gap-2">
                        <h1 className="text-display-xs font-semibold text-primary">
                            Akun berhasil di Aktivasi
                        </h1>
                        <p className="text-md text-tertiary">
                            Selamat! Akun Anda kini sudah aktif dan siap digunakan. Silakan masuk untuk mengakses dasbor Anda.
                        </p>
                    </div>
                </div>

                <div className="z-10 flex flex-col gap-3 mt-4">
                    <Button
                        size="lg"
                        onClick={() => router.replace("/login")}
                    >
                        Masuk ke Akun Lain
                    </Button>
                </div>
            </AuthLayout>
        );
    }

    // ── Validation Error Screen ───────────────────────────────────────────────
    if (isVerificationError) {
        return (
            <AuthLayout>
                <div className="flex flex-col items-center gap-6 text-center">
                    <div className="relative flex items-center justify-center">
                        <BackgroundPattern
                            pattern="grid"
                            className="absolute z-0 hidden md:block"
                            style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
                        />
                        <BackgroundPattern
                            pattern="grid"
                            size="md"
                            className="absolute z-0 md:hidden"
                            style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
                        />
                        <FeaturedIcon icon={AlertCircle} color="error" theme="light" size="xl" className="z-10" />
                    </div>
                    <div className="z-10 flex flex-col gap-2">
                        <h1 className="text-display-xs font-semibold text-primary">
                            Aktivasi Gagal
                        </h1>
                        <p className="text-md text-tertiary">
                            Tautan tidak valid atau sudah kedaluwarsa. Silakan daftar ulang atau minta tautan baru.
                        </p>
                    </div>
                </div>

                <div className="z-10 flex flex-col gap-3 mt-4">
                    <Button
                        size="lg"
                        onClick={() => router.push("/register")}
                    >
                        Lanjut Registrasi
                    </Button>
                    <Button
                        size="lg"
                        color="secondary"
                        onClick={() => router.replace("/login")}
                    >
                        Masuk ke Akun Lain
                    </Button>
                </div>
            </AuthLayout>
        );
    }

    // ── Login Form ────────────────────────────────────────────────────────────
    return (
        <AuthLayout
            rightPanelContent={
                <div className="flex flex-col gap-3">
                    <h2 className="text-2xl font-bold text-white">
                        Buat soal latihan dalam hitungan detik.
                    </h2>
                    <p className="text-sm text-white/70 leading-relaxed">
                        Soal dipersonalisasi menggunakan AI, selalu unik setiap sesi.
                    </p>
                    <div className="flex flex-col gap-1.5 mt-1">
                        <span className="text-sm text-white/60">✓ 14+ bahasa tersedia</span>
                        <span className="text-sm text-white/60">✓ Soal selalu unik</span>
                        <span className="text-sm text-white/60">✓ Reading, Writing, Speaking, Listening</span>
                    </div>
                </div>
            }
        >
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
                        alt={`${APP_NAME} Logo`}
                        width={48}
                        height={48}
                        className="relative z-10 object-contain"
                    />
                </div>
                <div className="z-10 flex flex-col gap-2 md:gap-3">
                    <h1 className="text-display-xs font-semibold text-primary md:text-display-sm">
                        Selamat datang kembali
                    </h1>
                    <p className="text-md text-tertiary">
                        Masuk ke akun {APP_NAME} Anda untuk melanjutkan.
                    </p>
                </div>
            </div>

            {/* Success message after password reset */}
            {resetSuccess && (
                <div className="z-10 rounded-xl border border-success-200 bg-success-50 p-4 dark:border-success-800 dark:bg-success-900/20">
                    <p className="text-sm font-medium text-success-700 dark:text-success-400">
                        ✅ Password berhasil diubah. Silakan login dengan password baru Anda.
                    </p>
                </div>
            )}

            {/* Login Form */}
            <Form onSubmit={handleSubmit} className="flex flex-col gap-6">
                <div className="flex flex-col gap-5">
                    {error && (
                        <AlertFloating
                            title="Login Gagal"
                            description={error}
                            confirmLabel=""
                            hideFooterActions
                            color="error"
                            onClose={() => setError(null)}
                        />
                    )}
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
                        placeholder="••••••••"
                    />
                    <div className="flex justify-end">
                        <Link
                            href="/forgot-password"
                            className="text-sm font-semibold text-brand-700 hover:text-brand-800"
                        >
                            Lupa password?
                        </Link>
                    </div>
                </div>

                <Button
                    type="submit"
                    size="lg"
                    isLoading={isLoading}
                    disabled={isLoading}
                >
                    Masuk
                </Button>

                <GoogleAuthButton />
            </Form>

            <div className="relative z-10 flex justify-center gap-1 text-center">
                <span className="text-sm text-tertiary">Belum punya akun?</span>
                <Link
                    href="/register"
                    className="text-sm font-semibold text-brand-700 hover:text-brand-800"
                >
                    Daftar sekarang
                </Link>
            </div>
        </AuthLayout>
    );
};
