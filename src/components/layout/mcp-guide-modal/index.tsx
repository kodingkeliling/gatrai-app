"use client";

import { useState } from "react";
import Image from "next/image";
import { Modal } from "@/components/shared-assets/modal";
import { Button } from "@/components/base/buttons/button";
import { ChevronLeft, ChevronRight, Link01, Copy01 } from "@untitledui/icons";
import { cx } from "@/utils/cx";
import { useToast } from "@/contexts/use-toast";

const MCP_ENDPOINT = "https://gatrai.kodingkeliling.com/api/mcp";

type AITool = "chatgpt" | "claude";

interface GuideStep {
    image: string;
    caption: string;
}

const GUIDES: Record<AITool, { title: string; steps: GuideStep[] }> = {
    chatgpt: {
        title: "ChatGPT",
        steps: [
            { image: "/mcp-guides/chatgpt/step-01.png", caption: "Buka ChatGPT → Explore GPTs → pilih tab Connectors, lalu klik + New connector." },
            { image: "/mcp-guides/chatgpt/step-02.png", caption: "Pilih MCP sebagai tipe koneksi, lalu tempel URL MCP endpoint di kolom yang tersedia." },
            { image: "/mcp-guides/chatgpt/step-03.png", caption: "Klik Save & Connect. ChatGPT akan mengarahkan Anda ke halaman otorisasi GatrAI." },
            { image: "/mcp-guides/chatgpt/step-04.png", caption: "Login ke GatrAI jika diminta, lalu klik Setujui & Hubungkan. Selesai! 🎉" },
        ],
    },
    claude: {
        title: "Claude",
        steps: [
            { image: "/mcp-guides/claude/step-01.png", caption: "Buka Claude → Settings → Integrations → klik Add integration." },
            { image: "/mcp-guides/claude/step-02.png", caption: "Masukkan nama (mis. GatrAI) dan tempel URL MCP endpoint di kolom Integration URL." },
            { image: "/mcp-guides/claude/step-03.png", caption: "Klik Add. Claude akan meminta otorisasi; login ke GatrAI jika diminta." },
            { image: "/mcp-guides/claude/step-04.png", caption: "Klik Setujui & Hubungkan. GatrAI sekarang aktif di Claude! 🎉" },
        ],
    },
};

interface MCPGuideModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const MCPGuideModal = ({ isOpen, onClose }: MCPGuideModalProps) => {
    const { toastSuccess } = useToast();
    const [activeTool, setActiveTool] = useState<AITool>("chatgpt");
    const [step, setStep] = useState(0);

    const guide = GUIDES[activeTool];
    const totalSteps = guide.steps.length;
    const currentStep = guide.steps[step];

    const handleToolChange = (tool: AITool) => {
        setActiveTool(tool);
        setStep(0);
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(MCP_ENDPOINT);
        toastSuccess("URL disalin ke clipboard!", "Berhasil");
    };

    return (
        <Modal
            isOpen={isOpen}
            onOpenChange={(open) => !open && onClose()}
            maxWidth="lg"
            showHeader={false}
            showFooter={false}
            bodyClassName="!overflow-hidden"
        >
            {/* Tab bar */}
            <div className="flex items-center gap-1 border-b border-secondary px-4 pt-4 pb-0 shrink-0">
                {(["chatgpt", "claude"] as AITool[]).map((tool) => (
                    <button
                        key={tool}
                        onClick={() => handleToolChange(tool)}
                        className={cx(
                            "px-4 py-2.5 text-sm font-semibold rounded-t-lg border-b-2 transition-colors capitalize cursor-pointer",
                            activeTool === tool
                                ? "border-brand-600 text-brand-700 dark:text-brand-400"
                                : "border-transparent text-tertiary hover:text-secondary"
                        )}
                    >
                        {tool === "chatgpt" ? "ChatGPT" : "Claude"}
                    </button>
                ))}
            </div>

            {/* Title */}
            <div className="px-6 pt-5 pb-2">
                <h2 className="text-lg font-semibold text-primary">
                    Cara Gratis: Connect GatrAI ke {guide.title}
                </h2>
                <p className="text-sm text-tertiary mt-0.5">
                    Ikuti langkah-langkah berikut untuk menghubungkan GatrAI MCP.
                </p>
            </div>

            {/* MCP URL copy */}
            <div className="mx-6 mb-4 flex items-center gap-2 rounded-xl border border-secondary bg-secondary/30 px-4 py-2.5">
                <Link01 className="size-4 shrink-0 text-tertiary" />
                <span className="flex-1 truncate text-xs font-mono text-secondary">{MCP_ENDPOINT}</span>
                <button
                    onClick={handleCopy}
                    className="flex items-center gap-1 text-xs font-semibold text-brand-700 hover:text-brand-800 cursor-pointer transition-colors"
                >
                    <Copy01 className="size-3.5" />
                    Salin
                </button>
            </div>

            {/* Carousel image */}
            <div className="mx-6 mb-3 overflow-hidden rounded-xl border border-secondary bg-secondary/20">
                <div className="relative aspect-video w-full">
                    <Image
                        key={`${activeTool}-${step}`}
                        src={currentStep.image}
                        alt={`Langkah ${step + 1}`}
                        fill
                        className="object-contain animate-in fade-in duration-300"
                    />
                </div>
            </div>

            {/* Caption */}
            <p className="mx-6 mb-4 text-sm text-secondary text-center leading-relaxed">
                <span className="font-semibold text-brand-700 dark:text-brand-400">Langkah {step + 1}.</span>{" "}
                {currentStep.caption}
            </p>

            {/* Navigation */}
            <div className="flex items-center justify-between gap-3 px-6 pb-6">
                <Button
                    size="sm"
                    color="secondary"
                    iconLeading={ChevronLeft}
                    onClick={() => setStep((s) => Math.max(0, s - 1))}
                    isDisabled={step === 0}
                >
                    Sebelumnya
                </Button>

                {/* Step dots */}
                <div className="flex items-center gap-1.5">
                    {Array.from({ length: totalSteps }).map((_, i) => (
                        <button
                            key={i}
                            onClick={() => setStep(i)}
                            className={cx(
                                "rounded-full transition-all duration-200 cursor-pointer",
                                i === step
                                    ? "w-4 h-2 bg-brand-600"
                                    : "w-2 h-2 bg-secondary hover:bg-tertiary"
                            )}
                            aria-label={`Langkah ${i + 1}`}
                        />
                    ))}
                </div>

                {step < totalSteps - 1 ? (
                    <Button
                        size="sm"
                        color="primary"
                        iconTrailing={ChevronRight}
                        onClick={() => setStep((s) => Math.min(totalSteps - 1, s + 1))}
                    >
                        Berikutnya
                    </Button>
                ) : (
                    <Button size="sm" color="primary" onClick={onClose}>
                        Selesai 🎉
                    </Button>
                )}
            </div>
        </Modal>
    );
};
