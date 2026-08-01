"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/base/buttons/button";
import { ThemeToggle } from "@/components/foundations/theme-toggle";
import { HistorySlideout } from "@/components/exam/history-slideout";
import { useAuthStore } from "@/store/use-auth-store";
import { cx } from "@/utils/cx";
import { MCPGuideModal } from "@/components/layout/mcp-guide-modal";

const NAV_ITEMS = [
    { label: "Beranda", href: "/" },
    { label: "Harga", href: "/pricing" },
    { label: "Pertanyaan", href: "/faq" },
    { label: "Hubungi", href: "/contact" },
];

function UserDropdown() {
    const router = useRouter();
    const { user, logout } = useAuthStore();
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const handleLogout = async () => {
        setOpen(false);
        await fetch("/api/auth/logout", { method: "POST" });
        logout();
        window.location.href = "/";
    };

    const isSuperAdmin = user?.role === "SUPER_ADMIN";

    const initials = user?.name
        ? user.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
        : user?.email?.slice(0, 2).toUpperCase() ?? "U";

    return (
        <div ref={ref} className="relative">
            <button
                onClick={() => setOpen((v) => !v)}
                className={cx(
                    "flex items-center gap-2.5 rounded-full border border-secondary px-3 py-1.5",
                    "bg-primary hover:bg-secondary transition-colors text-sm",
                    open && "bg-secondary"
                )}
            >
                {/* Avatar circle */}
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-semibold text-white">
                    {initials}
                </span>
                <span className="hidden sm:block max-w-[120px] truncate font-medium text-primary">
                    {user?.name || user?.email}
                </span>
                {/* Chevron */}
                <svg
                    width="12" height="12" viewBox="0 0 12 12" fill="none"
                    className={cx("text-tertiary transition-transform duration-200", open && "rotate-180")}
                >
                    <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </button>

            {/* Dropdown panel */}
            {open && (
                <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-secondary bg-primary shadow-lg z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                    {/* Header info */}
                    <div className="px-4 py-3 border-b border-secondary">
                        <p className="text-sm font-semibold text-primary truncate">{user?.name}</p>
                        <p className="text-xs text-tertiary truncate">{user?.email}</p>
                    </div>

                    {/* Menu items */}
                    <div className="py-1">
                        {/* Playground — hanya untuk USER biasa */}
                        {!isSuperAdmin && (
                            <Link
                                href="/playground"
                                onClick={() => setOpen(false)}
                                className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-secondary hover:bg-secondary hover:text-primary transition-colors"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polygon points="5,3 19,12 5,21" />
                                </svg>
                                Playground
                            </Link>
                        )}

                        {/* Dashboard */}
                        <Link
                            href="/dashboard"
                            onClick={() => setOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-secondary hover:bg-secondary hover:text-primary transition-colors"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="3" width="7" height="7" rx="1" />
                                <rect x="14" y="3" width="7" height="7" rx="1" />
                                <rect x="14" y="14" width="7" height="7" rx="1" />
                                <rect x="3" y="14" width="7" height="7" rx="1" />
                            </svg>
                            Dashboard
                        </Link>

                        <div className="my-1 border-t border-secondary" />

                        <button
                            onClick={handleLogout}
                            className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                                <polyline points="16,17 21,12 16,7" />
                                <line x1="21" y1="12" x2="9" y2="12" />
                            </svg>
                            Keluar
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export const Navbar = () => {
    const pathname = usePathname();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [mcpModalOpen, setMcpModalOpen] = useState(false);

    const { isAuthenticated, isAuthReady } = useAuthStore();

    return (
        <>
            <header className="relative z-50 w-full animate-[fadeSlideDown_0.6s_ease-out_both]">
            <div className="mx-auto flex w-full max-w-container items-center justify-between px-4 py-5 md:px-8">
                {/* Logo + Desktop nav */}
                <div className="flex items-center gap-6">
                    <Link href="/" className="flex items-center gap-2 shrink-0">
                        <Image src="/logo.png" className="object-contain" alt="GatrAI Logo" width={40} height={40} />
                        <Image src="/title-dark.png" className="object-contain dark:hidden" alt="GatrAI" width={80} height={32} />
                        <Image src="/title-light.png" className="object-contain hidden dark:block" alt="GatrAI" width={80} height={32} />
                    </Link>

                    <nav className="hidden md:flex items-center gap-1">
                        {NAV_ITEMS.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cx(
                                        "px-3 py-2 text-sm font-medium transition-colors",
                                        isActive
                                            ? "text-brand-700 dark:text-brand-400"
                                            : "text-secondary hover:text-primary"
                                    )}
                                >
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                {/* Right actions */}
                <div className="flex items-center gap-3">
                    <ThemeToggle />

                    {/* Wait until auth check is done to avoid flash */}
                    {!isAuthReady ? (
                        <div className="h-9 w-24 animate-pulse rounded-lg bg-secondary" />
                    ) : isAuthenticated ? (
                        <UserDropdown />
                    ) : (
                        <>
                            <Button size="sm" color="secondary" href="/login" className="hidden sm:flex">
                                Masuk
                            </Button>
                            <Button size="sm" onClick={() => setMcpModalOpen(true)} className="hidden md:flex">
                                Cara Gratis
                            </Button>
                        </>
                    )}

                    {/* Mobile hamburger */}
                    <button
                        className="flex md:hidden flex-col items-center justify-center w-9 h-9 gap-[5px] rounded-md"
                        onClick={() => setMobileOpen(!mobileOpen)}
                        aria-label="Toggle menu"
                    >
                        <span className={cx(
                            "block h-[2px] w-6 rounded-full bg-neutral-800 dark:bg-neutral-100 origin-center transition-all duration-300",
                            mobileOpen ? "rotate-45 translate-y-[7px]" : ""
                        )} />
                        <span className={cx(
                            "block h-[2px] w-6 rounded-full bg-neutral-800 dark:bg-neutral-100 transition-all duration-300",
                            mobileOpen ? "opacity-0 scale-x-0" : ""
                        )} />
                        <span className={cx(
                            "block h-[2px] w-6 rounded-full bg-neutral-800 dark:bg-neutral-100 origin-center transition-all duration-300",
                            mobileOpen ? "-rotate-45 -translate-y-[7px]" : ""
                        )} />
                    </button>
                </div>
            </div>

            {/* Mobile menu */}
            {mobileOpen && (
                <div className="md:hidden border-t border-secondary bg-primary px-4 py-4 flex flex-col gap-1 animate-in fade-in slide-in-from-top-2 duration-200">
                    {NAV_ITEMS.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setMobileOpen(false)}
                                className={cx(
                                    "px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                                    isActive
                                        ? "text-brand-700 dark:text-brand-400"
                                        : "text-secondary hover:text-primary"
                                )}
                            >
                                {item.label}
                            </Link>
                        );
                    })}
                    {!isAuthReady ? null : !isAuthenticated && (
                        <div className="flex gap-2 pt-2 border-t border-secondary mt-2">
                            <Button size="sm" color="secondary" href="/login" className="flex-1">Masuk</Button>
                            <Button size="sm" onClick={() => { setMobileOpen(false); setMcpModalOpen(true); }} className="flex-1">Cara Gratis</Button>
                        </div>
                    )}
                </div>
            )}
        </header>

            <MCPGuideModal isOpen={mcpModalOpen} onClose={() => setMcpModalOpen(false)} />
        </>
    );
};
