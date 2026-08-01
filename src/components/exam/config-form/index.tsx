"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/base/buttons/button";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { Input } from "@/components/base/input/input";
import { Label } from "@/components/base/input/label";
import { Select } from "@/components/base/select/select";
import { SkillType, useExamStore } from "@/store/use-exam-store";
import { useConfigStore, DEFAULT_MODELS, AIProvider } from "@/store/use-config-store";
import { ChevronDown, ChevronUp, Settings01, File06, Zap, Translate01, Lock01, LogIn01 } from "@untitledui/icons";
import { CustomKeyModal } from "@/components/exam/custom-key-modal";
import { cx } from "@/utils/cx";
import { useToast } from "@/contexts/use-toast";
import { useAuthStore } from "@/store/use-auth-store";

const FREE_LIMIT = 10;

const LANGUAGES = [
    { id: "English", label: "English" },
    { id: "Japanese", label: "Japanese (日本語)" },
    { id: "Korean", label: "Korean (한국어)" },
    { id: "French", label: "French (Français)" },
    { id: "Spanish", label: "Spanish (Español)" },
    { id: "Mandarin", label: "Mandarin (普通话)" },
    { id: "Arabic", label: "Arabic (العربية)" },
    { id: "German", label: "German (Deutsch)" },
    { id: "Italian", label: "Italian (Italiano)" },
    { id: "Portuguese", label: "Portuguese (Português)" },
    { id: "Russian", label: "Russian (Русский)" },
    { id: "Hindi", label: "Hindi (हिन्दी)" },
    { id: "Sundanese", label: "Sundanese (Basa Sunda)" },
    { id: "Javanese", label: "Javanese (Basa Jawa)" },
];

const StatusDot = ({ color = "success" }: { color?: "success" | "error" | "warning" }) => (
    <div className={cx(
        "size-2 rounded-full",
        color === "success" ? "bg-green-500 shadow-[0_0_8px_rgba(16,185,129,0.6)] animate-pulse" :
            color === "warning" ? "bg-yellow-500 shadow-[0_0_8px_rgba(247,144,9,0.6)]" :
                "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]"
    )} />
);

// Modal for trial limit reached
const TrialLimitModal = ({ isOpen, onClose, isLoggedIn }: { isOpen: boolean; onClose: () => void; isLoggedIn: boolean }) => {
    const router = useRouter();
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl border border-secondary bg-primary p-8 shadow-2xl">
                <div className="flex flex-col items-center gap-5 text-center">
                    <div className="flex size-14 items-center justify-center rounded-full bg-brand-100 text-brand-600">
                        <Lock01 className="size-7" />
                    </div>
                    <div className="flex flex-col gap-2">
                        <h2 className="text-xl font-semibold text-primary">Kuota Habis</h2>
                        <p className="text-sm text-tertiary leading-relaxed">
                            {isLoggedIn
                                ? <>Kuota soal kamu sudah habis. Upgrade paket untuk mendapatkan akses lebih banyak soal.</>
                                : <>Kamu sudah menggunakan <strong>{FREE_LIMIT} soal gratis</strong>. Buat akun atau login untuk melanjutkan dan mendapatkan akses lebih banyak soal.</>
                            }
                        </p>
                    </div>
                    <div className="flex flex-col w-full gap-3">
                        {isLoggedIn ? (
                            <Button
                                size="lg"
                                onClick={() => router.push("/pricing")}
                                className="w-full"
                            >
                                Langganan Sekarang
                            </Button>
                        ) : (
                            <>
                                <Button
                                    size="lg"
                                    iconLeading={LogIn01}
                                    onClick={() => router.push("/login?redirect=/")}
                                    className="w-full"
                                >
                                    Login Sekarang
                                </Button>
                                <Button
                                    size="lg"
                                    color="secondary"
                                    onClick={() => router.push("/register")}
                                    className="w-full"
                                >
                                    Buat Akun Gratis
                                </Button>
                            </>
                        )}
                        <button
                            onClick={onClose}
                            className="text-sm text-tertiary hover:text-secondary transition-colors"
                        >
                            Nanti saja
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const ConfigForm = ({ isPlayground = false }: { isPlayground?: boolean }) => {
    const router = useRouter();
    const { toastSuccess, toastError, toastWarning } = useToast();
    const createExamAction = useExamStore((state) => state.createNewExam);
    const user = useAuthStore((state) => state.user);

    const {
        provider, setProvider,
        modelName, setModelName,
        customApiKeys,
        usePersonalKey, setUsePersonalKey,
        connectionStatuses, updateStatus
    } = useConfigStore();

    const [language, setLanguage] = useState("English");
    const [questionCount, setQuestionCount] = useState(10);
    const [selectedSkills, setSelectedSkills] = useState<SkillType[]>(["Reading"]);
    const [isLoading, setIsLoading] = useState(false);
    const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isTrialLimitOpen, setIsTrialLimitOpen] = useState(false);
    const [trialUsed, setTrialUsed] = useState(0);
    const [trialChecked, setTrialChecked] = useState(false);

    // Locked = tidak login, ATAU planId bukan 'eksklusif'/'luxury'
    // null/undefined planId = belum berlangganan (auto-only)
    const canChooseProvider = !!user && (user.planId === 'eksklusif' || user.planId === 'luxury');
    const isLockedPlan = !canChooseProvider;

    // Initial status checks
    useEffect(() => {
        updateStatus("groq");
        updateStatus("gemini");
        updateStatus("openai");
        updateStatus("anthropic");
    }, []);

    // Check IP trial on mount
    useEffect(() => {
        const checkTrial = async () => {
            try {
                const res = await fetch("/api/trial");
                if (res.ok) {
                    const data = await res.json();
                    setTrialUsed(data.questionsUsed ?? 0);
                }
            } catch {
                // silently fail — non-blocking
            } finally {
                setTrialChecked(true);
            }
        };
        checkTrial();
    }, []);

    const handleGenerate = useCallback(async () => {
        if (selectedSkills.length === 0) {
            toastError("Pilih setidaknya satu skill yang ingin diuji.", "Belum Memilih Skill");
            return;
        }

        if (questionCount <= 0 || questionCount > 10) {
            toastError("Jumlah soal harus antara 1 dan 10.", "Jumlah Tidak Valid");
            return;
        }

        // Check IP trial limit
        try {
            const res = await fetch("/api/trial");
            if (res.ok) {
                const data = await res.json();
                if (data.limitReached) {
                    setIsTrialLimitOpen(true);
                    return;
                }
                setTrialUsed(data.questionsUsed ?? 0);
            }
        } catch {
            // non-blocking
        }

        const currentStatus = connectionStatuses[provider];
        if (currentStatus !== "connected") {
            toastWarning(
                `Provider ${provider.toUpperCase()} belum terhubung. Pembuatan soal mungkin gagal.`,
                "Peringatan Koneksi"
            );
        }

        setIsLoading(true);
        try {
            const examId = createExamAction({
                language,
                questionCount,
                skills: selectedSkills,
            }, user?.email ?? undefined);

            // Increment IP trial counter
            await fetch("/api/trial", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ count: questionCount }),
            }).catch(() => { });

            toastSuccess("Soal sedang dibuat, mohon tunggu.", "Berhasil");
            router.push(`/playground/${examId}`);
        } catch (e) {
            console.error(e);
            toastError("Gagal membuat soal. Silakan coba lagi.", "Error");
            setIsLoading(false);
        }
    }, [selectedSkills, questionCount, provider, language, connectionStatuses, createExamAction, router, toastError, toastSuccess, toastWarning]);

    const toggleSkill = (skill: SkillType) => {
        setSelectedSkills((prev) =>
            prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
        );
    };

    const models = DEFAULT_MODELS[provider] || [];

    const PROVIDERS: { id: AIProvider; label: string }[] = [
        { id: "groq", label: "Groq (Tercepat)" },
        { id: "gemini", label: "Google Gemini" },
        { id: "openai", label: "OpenAI (GPT)" },
        { id: "anthropic", label: "Anthropic (Claude)" },
    ];

    const currentStatus = connectionStatuses[provider];
    const dotColor = currentStatus === "connected" ? "success" : currentStatus === "no-quota" ? "warning" : "error";
    const hasActiveCustomKey = !!customApiKeys[provider];
    const remaining = Math.max(0, FREE_LIMIT - trialUsed);

    // Build the hint text for question count input
    const questionCountHint = (() => {
        if (!trialChecked) return "Maks. 10 soal selama versi Beta.";
        if (remaining <= 0) return "Kuota gratis habis.";
        const tokenEst = questionCount > 0 ? `Perkiraan: ${questionCount} token digunakan.` : "";
        return `Sisa kuota gratis: ${remaining} soal. ${tokenEst}`.trim();
    })();

    return (
        <>
            <TrialLimitModal isOpen={isTrialLimitOpen} onClose={() => setIsTrialLimitOpen(false)} isLoggedIn={!!user} />

            <div className="flex w-full flex-col gap-8 rounded-2xl border border-secondary bg-primary p-6 shadow-sm">
                <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                        <h2 className="text-display-xs font-semibold text-primary">
                        {isPlayground ? "Buat Quiz" : "Coba Buat Quiz"}
                    </h2>
                    </div>
                    <p className="text-sm text-tertiary">
                        Konfigurasi parameter untuk menghasilkan quiz bertenaga AI. Gratis untuk 10 soal pertama.
                    </p>
                </div>

                <div className="flex flex-col gap-6">
                    {/* Language */}
                    <div className="flex flex-col gap-1.5">
                        <Label>Bahasa yang Diuji</Label>
                        <Select
                            selectedKey={language}
                            onSelectionChange={(key) => setLanguage(key as string)}
                            placeholder="Pilih bahasa"
                            placeholderIcon={Translate01}
                        >
                            {LANGUAGES.map((lang) => (
                                <Select.Item key={lang.id} id={lang.id} label={lang.label}>{lang.label}</Select.Item>
                            ))}
                        </Select>
                    </div>

                    {/* Skills */}
                    <div className="flex flex-col gap-3">
                        <Label>Skill yang Diuji</Label>
                        <div className="grid grid-cols-2 gap-4">
                            {(["Reading", "Writing", "Speaking", "Listening"] as SkillType[]).map((skill) => (
                                <Checkbox
                                    key={skill}
                                    label={skill}
                                    isSelected={selectedSkills.includes(skill)}
                                    onChange={() => toggleSkill(skill)}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Question Count — hint shows quota */}
                    <div className="flex flex-col gap-1.5">
                        <Input
                            label="Jumlah Soal"
                            type="number"
                            inputMode="numeric"
                            value={questionCount.toString()}
                            onChange={(val: string) => {
                                const num = parseInt(val) || 0;
                                setQuestionCount(Math.max(0, Math.min(10, num)));
                            }}
                            placeholder="Contoh: 10"
                            icon={File06}
                            hint={questionCountHint}
                        />
                    </div>

                    {/* Advanced Toggle */}
                    <div className="border-t border-secondary pt-4">
                        <button
                            onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
                            className="flex w-full items-center justify-between text-sm font-semibold text-brand-700 hover:text-brand-800"
                        >
                            <div className="flex items-center gap-2">
                                <Settings01 className="size-4" />
                                <span>Pengaturan AI Lanjutan</span>
                            </div>
                            {isAdvancedOpen ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                        </button>

                        {isAdvancedOpen && (
                            <div className="mt-6 flex flex-col gap-6 animate-in fade-in slide-in-from-top-2 duration-300">
                                {/* Auto checkbox — always on and disabled for locked plan */}
                                <div className="flex items-center justify-between">
                                    <Label>Provider AI</Label>
                                    <div className="flex items-center gap-2">
                                        <span className={cx(
                                            "text-sm font-medium",
                                            isLockedPlan ? "text-tertiary" : "text-primary"
                                        )}>Auto</span>
                                        <Checkbox
                                            isSelected={isLockedPlan ? true : provider === "groq"}
                                            onChange={(checked) => {
                                                if (!isLockedPlan) {
                                                    if (checked) {
                                                        setProvider("groq");
                                                        const firstModel = DEFAULT_MODELS["groq"]?.[0]?.id;
                                                        if (firstModel) setModelName(firstModel);
                                                    } else {
                                                        // Switch to gemini as default manual provider
                                                        setProvider("gemini");
                                                        const firstModel = DEFAULT_MODELS["gemini"]?.[0]?.id;
                                                        if (firstModel) setModelName(firstModel);
                                                    }
                                                }
                                            }}
                                            isDisabled={isLockedPlan}
                                        />
                                    </div>
                                </div>

                                {/* Provider selector — hidden for locked plan */}
                                {!isLockedPlan && (
                                    <Select
                                        selectedKey={provider}
                                        onSelectionChange={(key) => {
                                            const newProvider = key as AIProvider;
                                            setProvider(newProvider);
                                            const firstModel = DEFAULT_MODELS[newProvider]?.[0]?.id;
                                            if (firstModel) setModelName(firstModel);
                                        }}
                                        placeholderIcon={<StatusDot color={dotColor} />}
                                    >
                                        {PROVIDERS.map((p) => {
                                            const status = connectionStatuses[p.id];
                                            const pDotColor = status === "connected" ? "success" : status === "no-quota" ? "warning" : "error";
                                            return (
                                                <Select.Item
                                                    key={p.id}
                                                    id={p.id}
                                                    label={p.label}
                                                    icon={<StatusDot color={pDotColor} />}
                                                >
                                                    <div className="flex items-center justify-between w-full">
                                                        <span>{p.label}</span>
                                                        {status === "disconnected" && <span className="text-[10px] font-medium text-red-600">Terputus</span>}
                                                        {status === "no-quota" && <span className="text-[10px] font-medium text-red-600">Kuota Habis</span>}
                                                    </div>
                                                </Select.Item>
                                            );
                                        })}
                                    </Select>
                                )}

                                {/* Model — hidden for locked plan */}
                                {!isLockedPlan && (
                                    <div className="flex flex-col gap-1.5">
                                        <Label>Nama Model</Label>
                                        <Select
                                            selectedKey={modelName}
                                            onSelectionChange={(key) => setModelName(key as string)}
                                            placeholderIcon={<StatusDot color={dotColor} />}
                                        >
                                            {models.map((m) => (
                                                <Select.Item
                                                    key={m.id}
                                                    id={m.id}
                                                    label={m.name}
                                                    icon={<StatusDot color={dotColor} />}
                                                >
                                                    {m.name}
                                                </Select.Item>
                                            ))}
                                        </Select>
                                    </div>
                                )}

                                {/* Lock notice for free/premium plan */}
                                {isLockedPlan && (
                                    <p className="text-xs text-tertiary">
                                        {!user
                                            ? "Login dan upgrade paket untuk memilih provider AI secara manual."
                                            : "Upgrade ke paket Eksklusif atau Luxury untuk memilih provider AI secara manual."
                                        }
                                    </p>
                                )}

                                {hasActiveCustomKey && !isLockedPlan && (
                                    <div className={cx(
                                        "flex items-center justify-between rounded-xl border p-3 transition-all duration-300",
                                        "border-green-200 bg-green-50 dark:border-green-500/30 dark:bg-green-500/5"
                                    )}>
                                        <div className="flex flex-col gap-0.5">
                                            <p className="text-sm font-semibold text-green-800 dark:text-green-300">Gunakan API Key {provider.toUpperCase()} Sendiri</p>
                                            <p className="text-xs text-green-600 dark:text-green-400/80">Bypass batas penggunaan global.</p>
                                        </div>
                                        <Checkbox
                                            isSelected={usePersonalKey}
                                            onChange={setUsePersonalKey}
                                        />
                                    </div>
                                )}

                                <Button
                                    color="secondary"
                                    size="sm"
                                    iconLeading={Zap}
                                    onClick={() => {
                                        if (!user) return router.push("/login");
                                        if (isLockedPlan) return router.push("/pricing");
                                        setIsModalOpen(true);
                                    }}
                                    disabled={isLockedPlan}
                                >
                                    {!user
                                        ? "Login untuk Gunakan API Key Sendiri"
                                        : isLockedPlan
                                            ? "Upgrade untuk Gunakan API Key Sendiri"
                                            : hasActiveCustomKey
                                                ? `Kelola API Key ${provider.toUpperCase()}`
                                                : `Gunakan API Key ${provider.toUpperCase()} Sendiri`
                                    }
                                </Button>
                            </div>
                        )}
                    </div>
                </div>

                <Button size="xl" onClick={handleGenerate} disabled={isLoading} isLoading={isLoading} className="w-full">
                    Buat Quiz Sekarang
                </Button>

                <CustomKeyModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    provider={provider}
                />
            </div>
        </>
    );
};
