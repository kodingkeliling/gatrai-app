"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu01, X } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { ThemeToggle } from "@/components/foundations/theme-toggle";
import { useAuthStore } from "@/store/use-auth-store";
import { cx } from "@/utils/cx";
import { MCPGuideModal } from "@/components/layout/mcp-guide-modal";
import { UserDropdown } from "@/components/layout/user-dropdown";

const NAV_ITEMS = [
    { label: "Beranda", href: "/" },
    { label: "Harga", href: "/pricing" },
    { label: "Pertanyaan", href: "/faq" },
    { label: "Hubungi", href: "/contact" },
];

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
                        <Button
                            size="sm"
                            color="tertiary"
                            className="flex md:hidden"
                            iconLeading={mobileOpen ? X : Menu01}
                            onClick={() => setMobileOpen(!mobileOpen)}
                            aria-label="Toggle menu"
                        />
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
