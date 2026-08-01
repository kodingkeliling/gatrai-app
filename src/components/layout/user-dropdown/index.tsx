"use client";

import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/use-auth-store";
import { Dropdown } from "@/components/base/dropdown/dropdown";
import { Avatar } from "@/components/base/avatar/avatar";
import { ChevronDown, Play, HomeLine, LayoutGrid02, LogOut01 } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";

export function UserDropdown() {
    const router = useRouter();
    const pathname = usePathname();
    const { user, logout } = useAuthStore();

    const handleLogout = async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        logout();
        window.location.href = "/";
    };

    const isSuperAdmin = user?.role === "SUPER_ADMIN";

    const initials = user?.name
        ? user.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
        : user?.email?.slice(0, 2).toUpperCase() ?? "U";

    // Determine dynamic menu item based on current route
    let dynamicItem: { label: string; href: string; icon: any } | null = null;
    if (!isSuperAdmin) {
        if (pathname.startsWith("/playground/") || pathname.startsWith("/result/")) {
            dynamicItem = { label: "Playground", href: "/playground", icon: Play };
        } else if (pathname.startsWith("/playground")) {
            dynamicItem = { label: "Beranda", href: "/", icon: HomeLine };
        } else {
            dynamicItem = { label: "Playground", href: "/playground", icon: Play };
        }
    }

    return (
        <Dropdown.Root>
            <Button
                color="secondary"
                size="md"
                className="rounded-full! pl-1.5! pr-3! py-1.5! h-max flex items-center gap-2"
            >
                <Avatar size="xs" initials={initials} contrastBorder={false} className="size-7! text-xs font-semibold bg-brand-600 text-white" />
                <span className="hidden sm:block max-w-[120px] truncate font-semibold text-secondary">
                    {user?.name || user?.email}
                </span>
                <ChevronDown className="size-4 shrink-0 text-fg-quaternary" />
            </Button>

            <Dropdown.Popover placement="bottom end" className="w-56 mt-2">
                <div className="flex flex-col border-b border-secondary px-4 py-3">
                    <p className="text-sm font-semibold text-primary truncate">{user?.name || "User"}</p>
                    <p className="text-xs text-tertiary truncate">{user?.email}</p>
                </div>
                <Dropdown.Menu>
                    {dynamicItem && (
                        <Dropdown.Item icon={dynamicItem.icon} href={dynamicItem.href}>
                            {dynamicItem.label}
                        </Dropdown.Item>
                    )}

                    <Dropdown.Item icon={LayoutGrid02} href="/dashboard">
                        Dashboard
                    </Dropdown.Item>

                    <Dropdown.Separator />

                    <Dropdown.Item icon={LogOut01} onAction={handleLogout}>
                        Keluar
                    </Dropdown.Item>
                </Dropdown.Menu>
            </Dropdown.Popover>
        </Dropdown.Root>
    );
}
