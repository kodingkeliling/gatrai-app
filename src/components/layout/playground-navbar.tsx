"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/foundations/theme-toggle";
import { useAuthStore } from "@/store/use-auth-store";
import { Button } from "@/components/base/buttons/button";
import { UserDropdown } from "@/components/layout/user-dropdown";
import { APP_NAME } from "@/config";

export const PlaygroundNavbar = () => {
    const { isAuthenticated } = useAuthStore();
    const router = useRouter();

    return (
        <header className="sticky top-0 z-50 w-full border-b border-secondary bg-primary/80 backdrop-blur-md">
            <div className="mx-auto flex w-full max-w-container items-center justify-between px-4 py-3 md:px-8">
                {/* Logo */}
                <Link href="/playground" className="flex items-center gap-2 shrink-0">
                    <Image src="/logo.png" className="object-contain" alt={`${APP_NAME} Logo`} width={32} height={32} />
                    <Image src="/title-dark.png" className="object-contain dark:hidden" alt={APP_NAME} width={68} height={28} />
                    <Image src="/title-light.png" className="object-contain hidden dark:block" alt={APP_NAME} width={68} height={28} />
                </Link>

                {/* Right actions */}
                <div className="flex items-center gap-3">
                    <ThemeToggle />
                    {isAuthenticated ? (
                        <UserDropdown />
                    ) : (
                        <Button
                            size="sm"
                            color="secondary"
                            onClick={() => router.push("/login?redirect=/playground")}
                        >
                            Masuk
                        </Button>
                    )}
                </div>
            </div>
        </header>
    );
};
