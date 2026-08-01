"use client";

import { useEffect, useState } from "react";
import { LinkExternal01, XClose } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { Badge } from "@/components/base/badges/badges";
import { type Ad } from "@/data/ads";
import Image from "next/image";

interface AdsModalProps {
    ad: Ad;
    onClose: () => void;
}

export const AdsModal = ({ ad, onClose }: AdsModalProps) => {
    const [secondsLeft, setSecondsLeft] = useState(5);

    useEffect(() => {
        if (secondsLeft <= 0) return;
        const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
        return () => clearTimeout(timer);
    }, [secondsLeft]);

    const canClose = secondsLeft === 0;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300 px-4">
            <div className="relative w-full max-w-lg rounded-2xl overflow-hidden bg-primary shadow-2xl animate-in zoom-in-95 duration-300">
                {/* Close / Countdown button */}
                <div className="absolute top-3 right-3 z-10">
                    {canClose ? (
                        <button
                            onClick={onClose}
                            aria-label="Tutup iklan"
                            className="flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm transition-all hover:bg-black/80"
                        >
                            <XClose className="size-3" />
                            Tutup
                        </button>
                    ) : (
                        <span className="flex items-center justify-center size-8 rounded-full bg-black/60 text-xs font-bold text-white backdrop-blur-sm">
                            {secondsLeft}
                        </span>
                    )}
                </div>

                {/* Sponsored label */}
                <div className="absolute top-3 left-3 z-10">
                    <span className="rounded-full bg-black/50 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur-sm">
                        Sponsored
                    </span>
                </div>

                {/* Image */}
                <div className="relative h-64 w-full bg-secondary sm:h-72">
                    <Image
                        src={ad.image}
                        alt={ad.title}
                        fill
                        className="object-cover"
                        unoptimized
                    />
                </div>

                {/* Content */}
                <div className="flex flex-col gap-5 p-6">
                    <div className="flex flex-col gap-2">
                        {ad.badge && (
                            <Badge type="pill-color" size="sm" color="brand">
                                {ad.badge}
                            </Badge>
                        )}
                        <h3 className="text-lg font-semibold text-primary">{ad.title}</h3>
                        <p className="text-sm text-tertiary leading-relaxed">{ad.description}</p>
                    </div>

                    <div className="flex gap-3">
                        <Button
                            color="secondary"
                            size="md"
                            className="flex-1"
                            onClick={onClose}
                            isDisabled={!canClose}
                        >
                            {canClose ? "Lewati" : `Lewati (${secondsLeft}s)`}
                        </Button>
                        <Button
                            size="md"
                            iconTrailing={LinkExternal01}
                            href={ad.visitUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1"
                        >
                            Kunjungi
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};
