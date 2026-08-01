"use client";

import { useState } from "react";
import Image from "next/image";
import type { Key } from "react-aria-components";
import { Modal } from "@/components/shared-assets/modal";
import { Button } from "@/components/base/buttons/button";
import { Tabs } from "@/components/application/tabs/tabs";
import { Select } from "@/components/base/select/select";
import { PaginationDot } from "@/components/application/pagination/pagination-dot";
import { ChevronLeft, ChevronRight, Link01, Copy01, PuzzlePiece01 } from "@untitledui/icons";
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

const TAB_ITEMS = [
    { id: "chatgpt", label: "ChatGPT" },
    { id: "claude", label: "Claude" },
];

export const MCPGuideModal = ({ isOpen, onClose }: MCPGuideModalProps) => {
    const { toastSuccess } = useToast();
    const [activeTool, setActiveTool] = useState<Key>("chatgpt");
    const [step, setStep] = useState(0);

    const guide = GUIDES[activeTool as AITool];
    const totalSteps = guide.steps.length;
    const currentStep = guide.steps[step];

    const handleToolChange = (key: Key) => {
        setActiveTool(key);
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
            maxWidth="2xl"
            title={`Cara Gratis: Connect GatrAI ke ${guide.title}`}
            description="Ikuti langkah-langkah berikut untuk menghubungkan GatrAI MCP ke model AI favorit Anda."
            icon={PuzzlePiece01}
            iconTheme="modern"
            iconColor="gray"
            showFooter={false}
            bodyClassName="!overflow-hidden"
        >
            <div className="flex flex-col">
                {/* Tabs */}
                <div className="px-6 pt-2 pb-4">
                    <Select
                        aria-label="Tabs"
                        size="md"
                        selectedKey={activeTool}
                        onSelectionChange={handleToolChange}
                        items={TAB_ITEMS}
                        className="w-full sm:hidden"
                    >
                        {(item) => <Select.Item id={item.id}>{item.label}</Select.Item>}
                    </Select>
                    <Tabs selectedKey={activeTool} onSelectionChange={handleToolChange} className="w-full max-sm:hidden">
                        <Tabs.List type="button-minimal" items={TAB_ITEMS} className="w-full bg-secondary/30 rounded-lg p-1">
                            {(tab) => <Tabs.Item {...tab} className="w-fit text-center" />}
                        </Tabs.List>
                    </Tabs>
                </div>

                {/* MCP URL copy */}
                <div className="mx-6 mb-4 flex items-center gap-2 rounded-xl border border-secondary bg-secondary/30 px-4 py-2.5">
                    <Link01 className="size-4 shrink-0 text-tertiary" />
                    <span className="flex-1 truncate text-xs font-mono text-secondary">{MCP_ENDPOINT}</span>
                    <Button
                        size="sm"
                        color="link-color"
                        iconLeading={Copy01}
                        onClick={handleCopy}
                        className="px-0 py-0 h-auto"
                    >
                        Salin
                    </Button>
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
                <p className="mx-6 mb-6 text-sm text-secondary text-center leading-relaxed h-10 flex items-center justify-center">
                    <span>
                        <span className="font-semibold text-brand-700 dark:text-brand-400">Langkah {step + 1}.</span>{" "}
                        {currentStep.caption}
                    </span>
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

                    <PaginationDot
                        size="md"
                        page={step + 1}
                        total={totalSteps}
                        onPageChange={(page) => setStep(page - 1)}
                    />

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
            </div>
        </Modal>
    );
};
