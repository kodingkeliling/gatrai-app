"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useExamStore, ExamAttempt, ExamStatus, SkillType } from "@/store/use-exam-store";
import { useAuthStore } from "@/store/use-auth-store";
import { Button } from "@/components/base/buttons/button";
import { cx } from "@/utils/cx";
import {
    ArrowRight,
    Calendar,
    CheckCircle,
    Clock,
    Play,
    Trash01,
    PlusCircle,
    SearchLg,
    FilterLines,
    UserPlus01,
    X,
    Mail01,
    Send01,
    LogOut01,
    ChevronDown,
    ChevronUp,
} from "@untitledui/icons";

// ─── Invite Modal ──────────────────────────────────────────────────────────────

function InviteModal({ examId, onClose }: { examId: string; onClose: () => void }) {
    const [input, setInput] = useState("");
    const [emails, setEmails] = useState<string[]>([]);
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        inputRef.current?.focus();
        const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, [onClose]);

    const addEmail = () => {
        const val = input.trim().toLowerCase();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!val) return;
        if (!emailRegex.test(val)) { setError("Format email tidak valid."); return; }
        if (emails.includes(val)) { setError("Email sudah ditambahkan."); return; }
        setEmails((p) => [...p, val]);
        setInput("");
        setError("");
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addEmail(); }
    };

    const removeEmail = (email: string) => setEmails((p) => p.filter((e) => e !== email));

    const handleSend = async () => {
        if (emails.length === 0) { setError("Tambahkan minimal satu email."); return; }
        setSending(true);
        try {
            await fetch("/api/exams/invite", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ examId, emails }),
            });
            setSent(true);
        } catch {
            setError("Gagal mengirim undangan. Coba lagi.");
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-md rounded-2xl border border-secondary bg-primary shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-secondary px-6 py-4">
                    <div className="flex items-center gap-2.5">
                        <div className="flex size-8 items-center justify-center rounded-full bg-brand-100 dark:bg-brand-950/30">
                            <UserPlus01 className="size-4 text-brand-600" />
                        </div>
                        <h3 className="text-base font-semibold text-primary">Undang Peserta</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="flex size-8 items-center justify-center rounded-lg text-tertiary hover:bg-secondary hover:text-primary transition-colors"
                    >
                        <X className="size-4" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 flex flex-col gap-4">
                    {sent ? (
                        <div className="flex flex-col items-center gap-3 py-6 text-center">
                            <div className="flex size-12 items-center justify-center rounded-full bg-success-100 dark:bg-success-950/30">
                                <CheckCircle className="size-6 text-success-600" />
                            </div>
                            <div>
                                <p className="font-semibold text-primary">Undangan Terkirim!</p>
                                <p className="text-sm text-tertiary mt-1">
                                    {emails.length} undangan berhasil dikirim.
                                </p>
                            </div>
                            <Button size="sm" color="secondary" onClick={onClose}>Tutup</Button>
                        </div>
                    ) : (
                        <>
                            <p className="text-sm text-tertiary">
                                Masukkan email peserta yang ingin diundang. Tekan Enter atau koma (,) untuk menambahkan beberapa.
                            </p>

                            {/* Email chips */}
                            {emails.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {emails.map((email) => (
                                        <span
                                            key={email}
                                            className="flex items-center gap-1.5 rounded-full bg-brand-50 dark:bg-brand-950/30 border border-brand-200 dark:border-brand-800 px-2.5 py-1 text-xs font-medium text-brand-700 dark:text-brand-300"
                                        >
                                            <Mail01 className="size-3" />
                                            {email}
                                            <button
                                                onClick={() => removeEmail(email)}
                                                className="ml-0.5 text-brand-500 hover:text-brand-700 transition-colors"
                                            >
                                                <X className="size-3" />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            )}

                            {/* Input */}
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <Mail01 className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-tertiary pointer-events-none" />
                                    <input
                                        ref={inputRef}
                                        type="email"
                                        value={input}
                                        onChange={(e) => { setInput(e.target.value); setError(""); }}
                                        onKeyDown={handleKeyDown}
                                        placeholder="nama@email.com"
                                        className="w-full h-10 pl-9 pr-3 rounded-lg border border-secondary bg-primary text-sm text-primary placeholder-tertiary outline-none focus:ring-2 ring-brand-500 focus:border-brand-400 transition-all"
                                    />
                                </div>
                                <button
                                    onClick={addEmail}
                                    type="button"
                                    className="shrink-0 flex items-center justify-center h-10 px-3 rounded-lg border border-secondary bg-primary text-sm font-medium text-secondary hover:bg-secondary hover:text-primary transition-colors"
                                >
                                    Tambah
                                </button>
                            </div>

                            {error && <p className="text-xs text-red-600">{error}</p>}
                        </>
                    )}
                </div>

                {/* Footer */}
                {!sent && (
                    <div className="flex items-center justify-end gap-2 border-t border-secondary px-6 py-4">
                        <Button size="sm" color="secondary" onClick={onClose}>Batal</Button>
                        <Button
                            size="sm"
                            iconLeading={Send01}
                            onClick={handleSend}
                            isLoading={sending}
                            isDisabled={emails.length === 0}
                        >
                            Kirim Undangan
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Exam Card ─────────────────────────────────────────────────────────────────

const SKILL_COLORS: Record<string, string> = {
    Reading: "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300",
    Writing: "bg-purple-50 text-purple-700 dark:bg-purple-950/30 dark:text-purple-300",
    Speaking: "bg-orange-50 text-orange-700 dark:bg-orange-950/30 dark:text-orange-300",
    Listening: "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-300",
};

interface ExamCardProps {
    exam: ExamAttempt;
    currentEmail?: string;
    onInvite: (id: string) => void;
}

function ExamCard({ exam, currentEmail, onInvite }: ExamCardProps) {
    const router = useRouter();
    const { deleteExam } = useExamStore();

    const handleAction = () => {
        if (exam.status === "completed") {
            router.push(`/result/${exam.id}`);
        } else {
            router.push(`/playground/${exam.id}`);
        }
    };

    const isOwner = !exam.ownedBy || exam.ownedBy === currentEmail;

    const statusLabel =
        exam.status === "completed" ? "Selesai"
            : exam.status === "ongoing"
                ? (exam.startTime === null ? "Belum dimulai" : "Sedang berlangsung")
                : exam.status === "generating" ? "Generating..."
                    : "Belum dimulai";

    return (
        <div className="group relative flex flex-col gap-3 rounded-xl border border-secondary bg-primary p-4 shadow-xs transition-all hover:shadow-md hover:border-brand-200 dark:hover:border-brand-800">
            {/* Status badge + delete/leave button */}
            <div className="flex items-start justify-between gap-2">
                <div className={cx(
                    "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold w-fit",
                    exam.status === "completed"
                        ? "bg-success-50 text-success-700 dark:bg-success-950/30 dark:text-success-300"
                        : exam.status === "ongoing"
                            ? (exam.startTime === null
                                ? "bg-warning-50 text-warning-700 dark:bg-warning-950/30 dark:text-warning-300"
                                : "bg-brand-50 text-brand-700 dark:bg-brand-950/30 dark:text-brand-300")
                            : "bg-secondary text-secondary"
                )}>
                    {exam.status === "completed" ? <CheckCircle className="size-3" /> : <Play className="size-3" />}
                    {statusLabel}
                </div>

                <button
                    onClick={() => deleteExam(exam.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity flex size-7 items-center justify-center rounded-lg text-tertiary hover:bg-error-50 hover:text-error-600 dark:hover:bg-red-950/20"
                    title={isOwner ? "Hapus ujian" : "Tinggalkan ujian"}
                >
                    {isOwner ? <Trash01 className="size-4" /> : <LogOut01 className="size-4" />}
                </button>
            </div>

            {/* Info */}
            <div className="flex flex-col gap-1.5">
                <p className="text-sm font-semibold text-primary">
                    {exam.config.questionCount} Soal · {exam.config.language}
                </p>
                <div className="flex flex-wrap gap-1.5">
                    {exam.config.skills.map((skill) => (
                        <span
                            key={skill}
                            className={cx("rounded-md px-2 py-0.5 text-[10px] font-semibold", SKILL_COLORS[skill] ?? "bg-secondary text-secondary")}
                        >
                            {skill}
                        </span>
                    ))}
                </div>
            </div>

            {/* Meta + actions */}
            <div className="flex items-center justify-between pt-1 border-t border-secondary gap-2 flex-wrap">
                <div className="flex items-center gap-3 text-xs text-tertiary flex-wrap">
                    <span className="flex items-center gap-1">
                        <Calendar className="size-3" />
                        {new Date(exam.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                    </span>
                    <span className="flex items-center gap-1">
                        <Clock className="size-3" />
                        {new Date(exam.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>

                    {/* Owner Badge */}
                    {!isOwner && exam.ownedBy && (
                        <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10 dark:bg-blue-950/30 dark:text-blue-300 dark:ring-blue-500/20">
                            Undangan: {exam.ownedBy.split("@")[0]}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {/* Hide Invite button if not owner */}
                    {isOwner && (
                        <button
                            onClick={() => onInvite(exam.id)}
                            className="flex items-center gap-1.5 rounded-lg border border-secondary px-2.5 py-1.5 text-xs font-semibold text-secondary hover:bg-secondary hover:text-primary hover:border-brand-400 transition-colors"
                            title="Undang peserta"
                        >
                            <UserPlus01 className="size-3.5" />
                            Undang
                        </button>
                    )}
                    <Button
                        size="sm"
                        color={exam.status === "completed" ? "secondary" : "primary"}
                        iconTrailing={ArrowRight}
                        onClick={handleAction}
                    >
                        {exam.status === "completed" ? "Lihat Hasil" : (exam.startTime === null ? "Mulai" : "Lanjutkan")}
                    </Button>
                </div>
            </div>
        </div>
    );
}

// ─── Main Component ────────────────────────────────────────────────────────────

type FilterStatus = "all" | ExamStatus;
type FilterSource = "all" | "self" | "invited";

const STATUS_FILTERS: { key: FilterStatus; label: string }[] = [
    { key: "all", label: "Semua Status" },
    { key: "ongoing", label: "Berlangsung" },
    { key: "completed", label: "Selesai" },
    { key: "idle", label: "Belum Mulai" },
];

const SOURCE_FILTERS: { key: FilterSource; label: string }[] = [
    { key: "all", label: "Semua Sumber" },
    { key: "self", label: "Dibuat Saya" },
    { key: "invited", label: "Undangan Teman" },
];

const ALL_SKILLS: SkillType[] = ["Reading", "Writing", "Speaking", "Listening"];

export const PlaygroundExamList = () => {
    const exams = useExamStore((s) => s.exams);
    const user = useAuthStore((s) => s.user);
    const [search, setSearch] = useState("");
    const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
    const [filterSource, setFilterSource] = useState<FilterSource>("all");
    const [filterSkills, setFilterSkills] = useState<SkillType[]>([]);
    const [inviteExamId, setInviteExamId] = useState<string | null>(null);
    const [isFiltersExpanded, setIsFiltersExpanded] = useState(false);

    const toggleSkill = (skill: SkillType) => {
        setFilterSkills((prev) =>
            prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
        );
    };

    useEffect(() => {
        if (!user) return;
        fetch("/api/exams")
            .then((res) => res.json())
            .then((data) => {
                if (data.exams && Array.isArray(data.exams)) {
                    data.exams.forEach((exam: any) => {
                        useExamStore.getState().addOrUpdateExam(exam);
                    });
                }
            })
            .catch((err) => console.error("Failed to sync exams from server:", err));
    }, [user]);

    const processed = useMemo(() => {
        let list = [...exams];

        // Status Filter
        if (filterStatus !== "all") {
            list = list.filter((e) => e.status === filterStatus);
        }

        // Source Filter
        if (filterSource !== "all") {
            list = list.filter((e) => {
                const isOwner = !e.ownedBy || e.ownedBy === user?.email;
                return filterSource === "self" ? isOwner : !isOwner;
            });
        }

        // Skill Filter
        if (filterSkills.length > 0) {
            list = list.filter((e) =>
                filterSkills.every((skill) => e.config.skills.includes(skill))
            );
        }

        // Search text Filter
        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(
                (e) =>
                    e.config.language.toLowerCase().includes(q) ||
                    e.config.skills.some((s) => s.toLowerCase().includes(q))
            );
        }

        list.sort((a, b) => {
            const statusOrder: Record<string, number> = { ongoing: 0, generating: 1, idle: 2, completed: 3 };
            const ao = statusOrder[a.status] ?? 99;
            const bo = statusOrder[b.status] ?? 99;
            if (ao !== bo) return ao - bo;
            return b.createdAt - a.createdAt;
        });

        return list;
    }, [exams, search, filterStatus, filterSource, filterSkills, user?.email]);

    const hasActiveFilter = filterStatus !== "all" || filterSource !== "all" || filterSkills.length > 0 || search.trim();

    return (
        <div className="flex flex-col gap-4">
            {/* Header */}
            <div>
                <h2 className="text-lg font-semibold text-primary">Ujian &amp; Soal Saya</h2>
                <p className="text-sm text-tertiary mt-0.5">
                    {exams.length > 0 ? `${exams.length} ujian tersimpan` : "Belum ada ujian yang dibuat"}
                </p>
            </div>

            {/* Search */}
            <div className="relative">
                <SearchLg className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-tertiary pointer-events-none" />
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Cari bahasa atau skill..."
                    className="w-full h-10 pl-9 pr-9 rounded-lg border border-secondary bg-primary text-sm text-primary placeholder-tertiary outline-none focus:ring-2 ring-brand-500 focus:border-brand-400 transition-all"
                />
                {search && (
                    <button
                        onClick={() => setSearch("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 flex size-5 items-center justify-center rounded-full text-tertiary hover:text-primary transition-colors"
                    >
                        <X className="size-3.5" />
                    </button>
                )}
            </div>

            {/* Filters */}
            <div className="flex flex-col gap-2.5">
                {/* Source filter */}
                <div className="flex items-center justify-between gap-1.5 flex-wrap">
                    <div className="flex items-center gap-1.5 flex-wrap">
                        <FilterLines className="size-3.5 text-tertiary shrink-0" />
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-tertiary mr-0.5 w-[50px]">Sumber</span>
                        {SOURCE_FILTERS.map((s) => (
                            <button
                                key={s.key}
                                onClick={() => setFilterSource(s.key)}
                                className={cx(
                                    "rounded-full px-3 py-1 text-xs font-semibold transition-colors border",
                                    filterSource === s.key
                                        ? "bg-brand-600 text-white border-brand-600"
                                        : "bg-primary text-secondary border-secondary hover:border-brand-400 hover:text-brand-700"
                                )}
                            >
                                {s.label}
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={() => setIsFiltersExpanded(!isFiltersExpanded)}
                        className="hidden md:flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 py-1.5 px-3 rounded-lg border border-secondary hover:border-brand-300 bg-primary/50 transition-all hover:bg-secondary cursor-pointer shrink-0"
                    >
                        <span>Filter Lainnya</span>
                        {isFiltersExpanded ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
                    </button>
                </div>

                {/* Collapsible filters container */}
                <div className={cx(
                    "grid transition-all duration-300 ease-in-out",
                    isFiltersExpanded
                        ? "grid-rows-[1fr] opacity-100 mt-2.5 md:mt-0.5"
                        : "grid-rows-[1fr] opacity-100 md:grid-rows-[0fr] md:opacity-0 md:overflow-hidden mt-2.5 md:mt-0"
                )}>
                    <div className="min-h-0 flex flex-col gap-2.5">
                        {/* Status filter */}
                        <div className="flex items-center gap-1.5 flex-wrap py-0.5">
                            <span className="size-3.5 shrink-0" />
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-tertiary mr-0.5 w-[50px]">Status</span>
                            {STATUS_FILTERS.map((f) => (
                                <button
                                    key={f.key}
                                    onClick={() => setFilterStatus(f.key)}
                                    className={cx(
                                        "rounded-full px-3 py-1 text-xs font-semibold transition-colors border",
                                        filterStatus === f.key
                                            ? "bg-brand-600 text-white border-brand-600"
                                            : "bg-primary text-secondary border-secondary hover:border-brand-400 hover:text-brand-700"
                                    )}
                                >
                                    {f.label}
                                </button>
                            ))}
                        </div>

                        {/* Skill filter (multi-select) */}
                        <div className="flex items-center gap-1.5 flex-wrap py-0.5">
                            <span className="size-3.5 shrink-0" />
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-tertiary mr-0.5 w-[50px]">Skill</span>
                            {ALL_SKILLS.map((skill) => (
                                <button
                                    key={skill}
                                    onClick={() => toggleSkill(skill)}
                                    className={cx(
                                        "rounded-full px-3 py-1 text-xs font-semibold transition-colors border",
                                        filterSkills.includes(skill)
                                            ? SKILL_COLORS[skill]?.replace("bg-", "border-") + " " + SKILL_COLORS[skill]
                                            : "bg-primary text-secondary border-secondary hover:border-brand-400 hover:text-brand-700"
                                    )}
                                >
                                    {skill}
                                </button>
                            ))}
                            {filterSkills.length > 0 && (
                                <button
                                    onClick={() => setFilterSkills([])}
                                    className="text-[10px] text-tertiary hover:text-primary transition-colors underline ml-2 cursor-pointer"
                                >
                                    Reset
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* List */}
            {processed.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-secondary bg-secondary/30 py-14 text-center">
                    <div className="flex size-14 items-center justify-center rounded-full bg-brand-50 dark:bg-brand-950/30">
                        <PlusCircle className="size-7 text-brand-600" />
                    </div>
                    <div className="flex flex-col gap-1">
                        <p className="text-sm font-semibold text-primary">
                            {hasActiveFilter ? "Tidak ada hasil" : "Belum ada ujian"}
                        </p>
                        <p className="text-xs text-tertiary">
                            {hasActiveFilter
                                ? "Coba ubah kata kunci atau filter."
                                : "Buat ujian pertama dari form di atas!"}
                        </p>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col gap-3">
                    {processed.map((exam) => (
                        <ExamCard
                            key={exam.id}
                            exam={exam}
                            currentEmail={user?.email}
                            onInvite={(id) => setInviteExamId(id)}
                        />
                    ))}
                </div>
            )}

            {/* Invite Modal */}
            {inviteExamId && (
                <InviteModal examId={inviteExamId} onClose={() => setInviteExamId(null)} />
            )}
        </div>
    );
};
