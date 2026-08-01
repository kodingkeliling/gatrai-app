"use client";

import { usePathname } from "next/navigation";
import { Button as AriaButton } from "react-aria-components";
import { useAuthStore } from "@/store/use-auth-store";
import { Dropdown } from "@/components/base/dropdown/dropdown";
import { ChevronDown, Play, HomeLine, LayoutGrid02, LogOut01 } from "@untitledui/icons";
import { cx } from "@/utils/cx";

export function UserDropdown() {
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
    let dynamicItem: { label: string; href: string; icon: React.FC<{ className?: string }> } | null = null;
    if (!isSuperAdmin) {
        if (pathname.startsWith("/playground/") || pathname.startsWith("/result/")) {
            dynamicItem = { label: "Playground", href: "/playground", icon: Play };
        } else if (pathname === "/playground") {
            dynamicItem = { label: "Beranda", href: "/", icon: HomeLine };
        } else {
            dynamicItem = { label: "Playground", href: "/playground", icon: Play };
        }
    }

    return (
        <Dropdown.Root>
            {/* Trigger — must be AriaButton directly under AriaMenuTrigger */}
            <AriaButton
                className={({ isPressed, isFocusVisible }) =>
                    cx(
                        "flex items-center gap-2.5 rounded-full border border-secondary px-3 py-1.5",
                        "bg-primary hover:bg-secondary transition-colors text-sm cursor-pointer outline-none",
                        (isPressed || isFocusVisible) && "bg-secondary"
                    )
                }
            >
                {/* Avatar circle */}
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-semibold text-white">
                    {initials}
                </span>
                <span className="hidden sm:block max-w-[120px] truncate font-medium text-primary">
                    {user?.name || user?.email}
                </span>
                {/* Chevron */}
                <ChevronDown className="size-3 text-tertiary transition-transform duration-200 group-data-[open]:rotate-180" />
            </AriaButton>

            <Dropdown.Popover placement="bottom end" className="w-56">
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
