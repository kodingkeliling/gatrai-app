"use client";

import Image from "next/image";
import { LinkExternal01, XClose } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { type Ad } from "@/data/ads";
import { cx } from "@/utils/cx";

interface AdsCardProps {
    ad: Ad;
    onDismiss?: () => void;
    className?: string;
}

export const AdsCard = ({ ad, onDismiss, className }: AdsCardProps) => {
    return (
        <div
            className={cx(
                "relative flex flex-col overflow-hidden rounded-2xl border border-secondary bg-primary shadow-md transition-all duration-300 animate-in fade-in slide-in-from-bottom-4",
                className
            )}
        >
            {/* Dismiss button */}
            {onDismiss && (
                <button
                    onClick={onDismiss}
                    aria-label="Tutup iklan"
                    className="absolute right-2.5 top-2.5 z-10 flex size-6 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition-colors hover:bg-black/60"
                >
                    <XClose className="size-3.5" />
                </button>
            )}

            {/* Sponsored label */}
            <div className="absolute left-2.5 top-2.5 z-10">
                <span className="rounded-full bg-black/40 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
                    Sponsored
                </span>
            </div>

            {/* Image */}
            <div className="relative h-40 w-full overflow-hidden bg-secondary">
                <Image
                    src={ad.image}
                    alt={ad.title}
                    fill
                    className="object-cover transition-transform duration-300 hover:scale-105"
                    unoptimized
                />
            </div>

            {/* Content */}
            <div className="flex flex-col gap-3 p-4">
                <div className="flex flex-col gap-1">
                    {ad.badge && (
                        <span className="w-fit rounded-full bg-brand-soft px-2.5 py-0.5 text-[10px] font-semibold text-brand-700">
                            {ad.badge}
                        </span>
                    )}
                    <h4 className="text-sm font-semibold text-primary">{ad.title}</h4>
                    <p className="text-xs text-tertiary leading-relaxed">{ad.description}</p>
                </div>

                <Button
                    size="sm"
                    color="secondary"
                    iconTrailing={LinkExternal01}
                    href={ad.visitUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full"
                >
                    Visit Link
                </Button>
            </div>
        </div>
    );
};
