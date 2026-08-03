"use client";

import { useEffect, useState } from "react";
import { PlaygroundNavbar } from "@/components/layout/playground-navbar";
import { PlaygroundExamList } from "@/components/playground/exam-list";
import { TokenStatusCard } from "@/components/playground/token-status-card";
import { ConfigForm } from "@/components/exam/config-form";
import { ArrowUp } from "@untitledui/icons";
import { cx } from "@/utils/cx";

function ScrollToTop() {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const onScroll = () => setVisible(window.scrollY > 300);
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    return (
        <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            aria-label="Scroll ke atas"
            className={cx(
                "fixed bottom-6 right-6 z-50 flex size-11 items-center justify-center rounded-full bg-brand-600 text-white shadow-lg transition-all duration-300 hover:bg-brand-700 hover:scale-105 active:scale-95",
                visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
            )}
        >
            <ArrowUp className="size-5" />
        </button>
    );
}

export const PlaygroundHome = () => {
    return (
        <div className="flex min-h-dvh flex-col bg-primary relative">
            {/* Subtle background gradient */}
            <div className="fixed inset-0 pointer-events-none select-none" style={{ zIndex: -1 }}>
                <div className="absolute -top-[20%] -left-[15%] size-[50%] rounded-full bg-brand-500/8 blur-[140px] animate-[pulse_8s_ease-in-out_infinite]" />
                <div className="absolute -bottom-[20%] -right-[15%] size-[50%] rounded-full bg-brand-400/8 blur-[140px] animate-[pulse_10s_ease-in-out_2s_infinite]" />
            </div>

            <PlaygroundNavbar />

            <main className="flex flex-1 flex-col">
                {/* Two-column layout */}
                <div className="mx-auto flex w-full max-w-container flex-1 flex-col gap-6 px-4 py-6 md:flex-row md:gap-8 md:px-8 md:py-8 lg:gap-12 items-start md:items-stretch">
                    {/* RIGHT — form generator (order-first on mobile) */}
                    <aside className="order-first md:order-last w-full md:w-[420px] lg:w-[460px] shrink-0 flex flex-col gap-4">
                        <TokenStatusCard />
                        <div className="md:sticky md:top-24">
                            <ConfigForm isPlayground />
                        </div>
                    </aside>

                    {/* LEFT — exam list */}
                    <section className="flex-1 min-w-0 order-last md:order-first">
                        <PlaygroundExamList />
                    </section>
                </div>
            </main>

            <ScrollToTop />
        </div>
    );
};
