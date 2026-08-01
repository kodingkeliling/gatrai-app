"use client";

import { useConfigStore } from "@/store/use-config-store";
import { useAuthStore } from "@/store/use-auth-store";
import { ShieldTick, Zap, Globe01, AlertTriangle } from "@untitledui/icons";
import { cx } from "@/utils/cx";

export const GlobalTokenBar = () => {
    const { connectionStatuses, provider, customApiKeys, usePersonalKey, isManualSelection } = useConfigStore();
    const user = useAuthStore((s) => s.user);

    const status = connectionStatuses[provider];
    const hasPersonalKey = !!customApiKeys[provider];
    const isUsingPersonal = hasPersonalKey && usePersonalKey;

    // User is in auto-only mode if: not logged in, OR plan is not eksklusif/luxury
    const isAutoOnly = !user || !(user.planId === "eksklusif" || user.planId === "luxury");
    // Show AUTO label when: user is auto-only (regardless of isManualSelection),
    // or using openrouter/auto mode, or hasn't made a manual selection
    const showAsAuto = isAutoOnly || !isManualSelection || provider === "openrouter";

    const getStatusConfig = () => {
        if (status === "connected") {
            return {
                label: isUsingPersonal ? `${provider.toUpperCase()} Personal Active` : showAsAuto ? "AUTO Global Active" : `${provider.toUpperCase()} Global Active`,
                sub: isUsingPersonal ? "Using your own API key." : "Using system-provided API key.",
                color: "success",
                icon: isUsingPersonal ? ShieldTick : Globe01
            };
        }
        if (status === "no-quota") {
            return {
                label: "Quota Exhausted",
                sub: `Your ${provider.toUpperCase()} quota is empty. Please check billing.`,
                color: "warning",
                icon: AlertTriangle
            };
        }
        return {
            label: "Disconnected",
            sub: `No valid API key found for ${provider.toUpperCase()}.`,
            color: "error",
            icon: Zap
        };
    };

    const config = getStatusConfig();
    const Icon = config.icon;

    return (
        <div className={cx(
            "flex w-full md:max-w-md md:mx-auto flex-col gap-1 rounded-xl border p-3 shadow-xs backdrop-blur-md transition-all duration-300",
            // Border & BG logic
            config.color === "success" ? "border-green-200 bg-green-50/50 dark:border-green-500/30 dark:bg-green-500/5" :
                config.color === "warning" ? "border-yellow-200 bg-yellow-50/50 dark:border-yellow-500/30 dark:bg-yellow-500/5" :
                    "border-red-200 bg-red-50/50 dark:border-red-500/30 dark:bg-red-500/5"
        )}>
            <div className="flex items-center justify-between text-xs font-medium">
                <div className="flex items-center gap-1.5">
                    <Icon className={cx(
                        "size-3.5",
                        config.color === "success" ? "text-green-600 dark:text-green-400" :
                            config.color === "warning" ? "text-yellow-600 dark:text-yellow-400" :
                                "text-red-600 dark:text-red-400"
                    )} />
                    <span className={cx(
                        "capitalize font-bold",
                        config.color === "success" ? "text-green-700 dark:text-green-300" :
                            config.color === "warning" ? "text-yellow-700 dark:text-yellow-300" :
                                "text-red-700 dark:text-red-300"
                    )}>
                        {config.label}
                    </span>
                </div>

                <div className="flex items-center gap-1.5">
                    <div className={cx(
                        "size-2 rounded-full",
                        config.color === "success" ? "bg-green-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]" :
                            config.color === "warning" ? "bg-yellow-500 shadow-[0_0_8px_rgba(234,170,8,0.6)]" :
                                "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]"
                    )} />
                </div>
            </div>

            <p className="text-[10px] text-tertiary dark:text-secondary-dark">
                {config.sub}
            </p>
        </div>
    );
};
