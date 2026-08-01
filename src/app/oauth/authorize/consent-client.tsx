"use client";

import { useState } from "react";
import { AuthUser } from "@/api/auth";

interface ConsentClientPageProps {
    user: AuthUser;
    clientId: string;
    redirectUri: string;
    responseType: string;
    state: string;
    codeChallenge: string;
    codeChallengeMethod: string;
}

export function ConsentClientPage({
    user,
    clientId,
    redirectUri,
    responseType,
    state,
    codeChallenge,
    codeChallengeMethod
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
                    codeChallengeMethod
                })
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
        } catch (err) {
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

    return (
        <div className="min-h-screen flex items-center justify-center bg-radial from-slate-900 to-slate-950 p-6 text-slate-100 font-sans">
            <div className="w-full max-w-md bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl p-8 flex flex-col gap-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500" />
                
                {/* Header */}
                <div className="text-center flex flex-col gap-2 mt-2">
                    <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                        Otorisasi GatrAI MCP
                    </h1>
                    <p className="text-sm text-slate-400">
                        Host AI meminta akses aman ke akun GatrAI Anda.
                    </p>
                </div>

                {/* User Info */}
                <div className="bg-slate-800/40 border border-slate-800/80 rounded-xl p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-violet-600/20 text-violet-400 border border-violet-500/30 flex items-center justify-center font-semibold text-lg">
                        {user.name ? user.name[0].toUpperCase() : user.email[0].toUpperCase()}
                    </div>
                    <div>
                        <div className="font-medium text-slate-200 text-sm">{user.name || "User"}</div>
                        <div className="text-xs text-slate-400">{user.email}</div>
                    </div>
                </div>

                {/* Permissions list */}
                <div className="flex flex-col gap-3">
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        Izin yang diminta:
                    </div>
                    <ul className="flex flex-col gap-2.5 text-sm text-slate-300">
                        <li className="flex items-start gap-2.5">
                            <span className="text-violet-400 mt-0.5">✦</span>
                            <span>Melihat daftar hasil ujian bahasa Anda.</span>
                        </li>
                        <li className="flex items-start gap-2.5">
                            <span className="text-violet-400 mt-0.5">✦</span>
                            <span>Mendapatkan detail detail ujian bahasa per ID.</span>
                        </li>
                        <li className="flex items-start gap-2.5">
                            <span className="text-violet-400 mt-0.5">✦</span>
                            <span>Mengecek status server AI provider GatrAI.</span>
                        </li>
                        {user.role === "SUPER_ADMIN" && (
                            <li className="flex items-start gap-2.5 text-amber-300">
                                <span className="text-amber-400 mt-0.5">⚠</span>
                                <span>Akses admin untuk melihat daftar user terdaftar (hanya SUPER_ADMIN).</span>
                            </li>
                        )}
                    </ul>
                </div>

                {error && (
                    <div className="bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs rounded-lg p-3 text-center">
                        {error}
                    </div>
                )}

                {/* Actions */}
                <div className="flex flex-col gap-3 mt-2">
                    <button
                        onClick={handleAuthorize}
                        disabled={isLoading}
                        className="w-full py-3 px-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 active:from-violet-700 active:to-indigo-700 disabled:opacity-50 text-white font-medium rounded-xl transition duration-200 shadow-lg shadow-indigo-500/20 text-sm cursor-pointer"
                    >
                        {isLoading ? "Memproses..." : "Setujui & Hubungkan"}
                    </button>
                    <button
                        onClick={handleCancel}
                        disabled={isLoading}
                        className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 active:bg-slate-900 disabled:opacity-50 text-slate-300 hover:text-white font-medium rounded-xl transition duration-200 text-sm cursor-pointer"
                    >
                        Batal
                    </button>
                </div>
            </div>
        </div>
    );
}
