"use client";

import { useState } from "react";
import Image from "next/image";
import { APP_NAME, APP_LOGO } from "@/config";
import { Button } from "@/components/base/buttons/button";
import { AuthUser } from "@/api/auth";
import { CheckCircle, Shield01, BarChart04, Settings01 } from "@untitledui/icons";

interface ConsentClientPageProps {
    user: AuthUser;
    clientId: string;
    redirectUri: string;
    responseType: string;
    state: string;
    codeChallenge: string;
    codeChallengeMethod: string;
}

const PERMISSIONS = [
    {
        icon: BarChart04,
        label: "Melihat daftar & detail hasil ujian bahasa Anda",
    },
    {
        icon: CheckCircle,
        label: "Mengecek status server AI provider GatrAI",
    },
];

export function ConsentClientPage({
    user,
    clientId,
    redirectUri,
    responseType,
    state,
    codeChallenge,
    codeChallengeMethod,
}: ConsentClientPageProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleAuthorize = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const res = await fetch("/api/oauth/authorize", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: user.id,
                    clientId,
                    redirectUri,
                    responseType,
                    state,
                    codeChallenge,
                    codeChallengeMethod,
                }),
            });

            const data = await res.json();
            if (!res.ok) {
                setError(data.error || "Gagal memproses otorisasi.");
                return;
            }

            if (data.redirectUrl) {
                window.location.href = data.redirectUrl;
            } else {
                setError("Response tidak valid dari server.");
            }
        } catch {
            setError("Koneksi gagal. Silakan coba lagi.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancel = () => {
        if (redirectUri) {
            const url = new URL(redirectUri);
            url.searchParams.set("error", "access_denied");
            if (state) url.searchParams.set("state", state);
            window.location.href = url.toString();
        } else {
            window.close();
        }
    };

    const initials = user.name
        ? user.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
        : user.email.slice(0, 2).toUpperCase();

    return (
        <div className="min-h-screen flex items-center justify-center bg-primary p-4 sm:p-6">
            <div className="w-full max-w-md flex flex-col gap-0 rounded-2xl border border-secondary bg-primary shadow-xl overflow-hidden">

                {/* Top accent bar */}
                <div className="h-1 w-full bg-gradient-to-r from-brand-600 via-brand-500 to-brand-400" />

                {/* Header */}
                <div className="flex flex-col items-center gap-4 px-6 pt-8 pb-6 text-center border-b border-secondary">
                    <div className="flex items-center gap-2">
                        <Image
                            src={APP_LOGO}
                            alt={`${APP_NAME} Logo`}
                            width={32}
                            height={32}
                            className="object-contain"
                        />
                        <span className="text-lg font-bold text-primary tracking-tight">
                            {APP_NAME}
                        </span>
                    </div>
                    <div className="flex flex-col gap-1">
                        <h1 className="text-xl font-semibold text-primary">
                            Hubungkan ke GatrAI MCP
                        </h1>
                        <p className="text-sm text-tertiary leading-relaxed">
                            Host AI meminta akses aman ke akun GatrAI Anda.
                        </p>
                    </div>
                </div>

                {/* User info */}
                <div className="px-6 py-4 border-b border-secondary">
                    <div className="flex items-center gap-3 rounded-xl border border-secondary bg-secondary/30 px-4 py-3">
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-semibold text-white">
                            {initials}
                        </span>
                        <div className="min-w-0">
                            <p className="text-sm font-semibold text-primary truncate">{user.name || "User"}</p>
                            <p className="text-xs text-tertiary truncate">{user.email}</p>
                        </div>
                    </div>
                </div>

                {/* Permissions */}
                <div className="px-6 py-4 flex flex-col gap-3 border-b border-secondary">
                    <p className="text-xs font-semibold text-tertiary uppercase tracking-wider">
                        Izin yang diminta
                    </p>
                    <ul className="flex flex-col gap-3">
                        {PERMISSIONS.map(({ icon: Icon, label }) => (
                            <li key={label} className="flex items-center gap-3 text-sm text-secondary">
                                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-50 dark:bg-brand-950/30 text-brand-600 dark:text-brand-400">
                                    <Icon className="size-3.5" />
                                </span>
                                {label}
                            </li>
                        ))}
                        {user.role === "SUPER_ADMIN" && (
                            <li className="flex items-center gap-3 text-sm text-warning-700 dark:text-warning-400">
                                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-warning-50 dark:bg-warning-950/30 text-warning-600 dark:text-warning-400">
                                    <Settings01 className="size-3.5" />
                                </span>
                                Akses admin: melihat daftar user terdaftar
                            </li>
                        )}
                    </ul>
                </div>

                {/* Security note */}
                <div className="px-6 py-3 bg-secondary/20 border-b border-secondary flex items-center gap-2">
                    <Shield01 className="size-3.5 shrink-0 text-tertiary" />
                    <p className="text-xs text-tertiary">
                        GatrAI tidak akan pernah membagikan password Anda.
                    </p>
                </div>

                {/* Error */}
                {error && (
                    <div className="mx-6 mt-4 rounded-lg border border-error-200 bg-error-50 dark:border-error-800 dark:bg-error-950/30 px-4 py-3 text-sm text-error-700 dark:text-error-400">
                        {error}
                    </div>
                )}

                {/* Actions */}
                <div className="flex flex-col gap-3 px-6 py-6">
                    <Button
                        size="lg"
                        color="primary"
                        onClick={handleAuthorize}
                        isLoading={isLoading}
                        className="w-full"
                    >
                        Setujui &amp; Hubungkan
                    </Button>
                    <Button
                        size="lg"
                        color="secondary"
                        onClick={handleCancel}
                        isDisabled={isLoading}
                        className="w-full"
                    >
                        Batal
                    </Button>
                </div>
            </div>
        </div>
    );
}
