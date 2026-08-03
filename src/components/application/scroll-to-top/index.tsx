"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { cx } from "@/utils/cx";

export function ScrollToTop() {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const onScroll = () => setVisible(window.scrollY > 300);
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    return (
        <div className={cx(
            "fixed bottom-6 right-6 z-50 transition-all duration-300",
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
        )}>
            <Button
                iconLeading={ArrowUp}
                color="primary"
                size="lg"
                className="rounded-full shadow-lg hover:scale-105 active:scale-95 !transition-transform"
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                aria-label="Scroll ke atas"
            />
        </div>
    );
}
