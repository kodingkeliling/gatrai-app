"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle, ChevronLeft, Flag01, LayoutGrid02, Zap, LogOut01 } from "@untitledui/icons";
import { Button } from "../../components/base/buttons/button";
import { Input } from "../../components/base/input/input";
import { FeaturedIcon } from "../../components/foundations/featured-icon/featured-icon";
import { ProgressBar } from "../../components/base/progress-indicators/progress-indicators";
import { QuestionOptions } from "../../components/exam/question-options";
import { AudioPlayer } from "../../components/exam/audio-player";
import { SpeakingInput } from "../../components/exam/speaking-input";
import { ThemeToggle } from "../../components/foundations/theme-toggle";
import { useExamStore, useActiveExam, Question } from "../../store/use-exam-store";
import { useConfigStore } from "../../store/use-config-store";
import { cx } from "../../utils/cx";
import { Markdown } from "../../components/shared-assets/markdown";
import { Dialog, DialogTrigger, Modal, ModalOverlay } from "../../components/application/modals/modal";
import { Heading as AriaHeading } from "react-aria-components";
import { useToast } from "@/contexts/use-toast";
import { useAuthStore } from "@/store/use-auth-store";
import { PlaygroundUserDropdown } from "@/components/layout/playground-navbar";
import Image from "next/image";
import { AdsCard } from "@/components/shared-assets/ads-card";
import { ADS, PAID_PLAN_IDS } from "@/data/ads";

export const PlaygroundScreen = () => {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;
    const activeExam = useActiveExam();
    const { toastError, toastWarning } = useToast();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [isExitModalOpen, setIsExitModalOpen] = useState(false);
    const { isAuthenticated, user } = useAuthStore();
    const showAds = !user?.planId || !PAID_PLAN_IDS.includes(user.planId);
    const [currentAdIndex, setCurrentAdIndex] = useState(0);
    const [isDismissed, setIsDismissed] = useState(false);
    const {
        selectExam,
        setQuestions,
        setStatus,
        setAnswer,
        nextQuestion,
        prevQuestion,
        goToQuestion,
        finishExam,
        deleteExam,
        exams,
        hasHydrated,
        startExam,
    } = useExamStore();

    const [generatingProgress, setGeneratingProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const isGenerating = useRef(false);

    const {
        provider,
        modelName,
        customApiKeys,
        usePersonalKey
    } = useConfigStore();

    const generateAllQuestions = useCallback(async () => {
        if (isGenerating.current || !activeExam) return;
        isGenerating.current = true;

        setStatus("generating");
        setError(null);
        setGeneratingProgress(0);

        const chunkSize = 1;
        const total = activeExam.config.questionCount;
        const chunks = Math.ceil(total / chunkSize);

        let allQuestions: Question[] = [];

        try {
            for (let i = 0; i < chunks; i++) {
                const range = `question number ${i + 1}`;
                const config = activeExam.config;
                const skill = config.skills[Math.floor(Math.random() * config.skills.length)];

                const response = await fetch("/api/generate", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        range,
                        skill,
                        language: config.language,
                        provider,
                        model: modelName,
                        customApiKey: usePersonalKey ? customApiKeys[provider] : undefined
                    }),
                });

                const chunkData = await response.json();

                if (!response.ok) {
                    const errorMessage = chunkData.error || "Reached usage limit or API error.";

                    if (allQuestions.length > 0) {
                        toastWarning(
                            `Generation partially stopped: ${errorMessage}. Using ${allQuestions.length} questions.`,
                            "Partial Content Generated"
                        );
                        break;
                    } else {
                        throw new Error(errorMessage);
                    }
                }

                const { questions: chunkQuestions } = chunkData;
                allQuestions = [...allQuestions, ...chunkQuestions];
                setGeneratingProgress(Math.round(((i + 1) / chunks) * 100));
            }

            if (allQuestions.length === 0) {
                throw new Error("AI failed to generate any questions. Please try again.");
            }

            setQuestions(allQuestions);
            setStatus("ongoing");
        } catch (err: any) {
            console.error(err);
            const errorMessage = err.message || "Failed to generate questions. Please try again.";
            setError(errorMessage);

            toastError(errorMessage, "Generation Failed");

            if (activeExam) {
                deleteExam(activeExam.id);
            }
            router.push("/");
        } finally {
            isGenerating.current = false;
        }
    }, [activeExam, setStatus, setQuestions, toastError, toastWarning, router, deleteExam, provider, modelName, customApiKeys, usePersonalKey]);

    // Sync active exam with URL
    useEffect(() => {
        if (hasHydrated && id && id !== activeExam?.id) {
            selectExam(id);
        }
    }, [id, activeExam?.id, selectExam, hasHydrated]);

    // If no active exam and not found in list, redirect back home
    useEffect(() => {
        if (hasHydrated && id && !exams.find(e => e.id === id)) {
            router.push("/");
        }
    }, [id, exams, router, hasHydrated]);

    // Handle initial generation if status is idle
    useEffect(() => {
        if (activeExam?.status === "idle" && (activeExam?.config?.questionCount || 0) > 0) {
            generateAllQuestions();
        }
    }, [activeExam?.status, generateAllQuestions]);

    if (!activeExam) return null;

    const { config, questions, status, currentQuestionIndex, userAnswers } = activeExam;

    if (status === "generating") {
        return (
            <div className="flex h-dvh flex-col items-center justify-center gap-8 bg-primary px-4">
                <div className="flex flex-col items-center gap-4 text-center">
                    <FeaturedIcon icon={Zap} color="brand" theme="light" size="lg" className="animate-pulse" />
                    <h2 className="text-display-sm font-semibold text-primary">AI is crafting your exam...</h2>
                    <p className="text-md text-tertiary">Generating {config.questionCount} questions based on your preferences.</p>
                </div>
                <div className="w-full max-w-md">
                    <ProgressBar value={generatingProgress} labelPosition="bottom" />
                </div>
            </div>
        );
    }

    if (error && questions.length === 0) {
        return (
            <div className="flex h-dvh flex-col items-center justify-center gap-6 bg-primary px-4">
                <div className="text-center">
                    <h2 className="text-display-sm font-semibold text-error-600">Oops! Something went wrong</h2>
                    <p className="mt-2 text-md text-tertiary">{error}</p>
                </div>
                <Button onClick={generateAllQuestions}>Retry Generation</Button>
                <Button color="secondary" onClick={() => { deleteExam(activeExam.id); router.push("/"); }}>Cancel & Back Home</Button>
            </div>
        );
    }

    if (questions.length === 0) {
        return (
            <div className="flex h-dvh flex-col items-center justify-center gap-6 bg-primary px-4">
                <div className="text-center">
                    <FeaturedIcon icon={Zap} color="brand" theme="light" size="lg" />
                    <h2 className="text-display-sm font-semibold text-primary">No questions found</h2>
                    <p className="mt-2 text-md text-tertiary">We couldn't find any questions for this exam.</p>
                </div>
                <Button onClick={generateAllQuestions}>Generate Questions</Button>
                <Button color="secondary" onClick={() => router.push("/")}>Back to Home</Button>
            </div>
        );
    }

    const currentQuestion = questions[currentQuestionIndex];
    if (!currentQuestion && questions.length > 0) {
        return (
            <div className="flex h-dvh flex-col items-center justify-center gap-6 bg-primary px-4 text-center">
                <p className="text-md text-tertiary">Loading question {currentQuestionIndex + 1}...</p>
                <Button color="secondary" onClick={() => goToQuestion(0)}>Reset to Question 1</Button>
            </div>
        );
    }

    // Safety fallback for empty questions after loading
    if (questions.length === 0) return null;

    const isLastQuestion = currentQuestionIndex === questions.length - 1;

    const handleExit = () => {
        if (isAuthenticated) {
            router.push("/playground");
        } else {
            router.push("/");
        }
    };

    const SKILL_COLORS: Record<string, string> = {
        Reading: "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300",
        Writing: "bg-purple-50 text-purple-700 dark:bg-purple-950/30 dark:text-purple-300",
        Speaking: "bg-orange-50 text-orange-700 dark:bg-orange-950/30 dark:text-orange-300",
        Listening: "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-300",
    };

    if (activeExam.startTime === null) {
        return (
            <div className="flex min-h-dvh flex-col bg-primary animate-in fade-in duration-300">
                <header className="sticky top-0 z-30 border-b border-secondary bg-primary px-4 py-3 md:px-8">
                    <div className="mx-auto flex w-full max-w-container items-center justify-between">
                        <div className="flex items-center gap-2 md:gap-4">
                            <button
                                onClick={handleExit}
                                className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-secondary transition-colors"
                            >
                                <Image src="/logo.png" className="object-contain" alt="GatrAI Logo" width={28} height={28} />
                            </button>
                            <hr className="h-4 w-px bg-border-secondary md:h-6" />
                            <span className="text-xs font-semibold text-primary md:text-sm">
                                Persiapan Ujian
                            </span>
                        </div>
                        <div className="flex items-center gap-2.5">
                            <ThemeToggle />
                            {isAuthenticated && (
                                <div className="hidden md:block">
                                    <PlaygroundUserDropdown />
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-4 py-12">
                    <div className="flex flex-col items-center gap-6 rounded-2xl border border-secondary bg-primary_alt p-8 text-center shadow-md">
                        <FeaturedIcon icon={Zap} color="brand" theme="light" size="xl" />
                        <div className="flex flex-col gap-2">
                            <h2 className="text-display-xs font-semibold text-primary">Siap untuk Memulai Ujian?</h2>
                            <p className="text-sm text-tertiary">
                                Silakan periksa kembali konfigurasi ujian Anda sebelum memulai. Timer akan mulai berjalan setelah Anda menekan tombol di bawah.
                            </p>
                        </div>

                        <div className="w-full border-t border-b border-secondary py-4 text-left flex flex-col gap-3">
                            <div className="flex justify-between py-1 text-sm">
                                <span className="text-tertiary">Bahasa</span>
                                <span className="font-semibold text-primary">{config.language}</span>
                            </div>
                            <div className="flex justify-between py-1.5 text-sm border-t border-secondary">
                                <span className="text-tertiary">Jumlah Soal</span>
                                <span className="font-semibold text-primary">{questions.length} Soal</span>
                            </div>
                            <div className="flex justify-between py-1.5 text-sm border-t border-secondary">
                                <span className="text-tertiary">Skill yang Diuji</span>
                                <div className="flex flex-wrap gap-1 justify-end max-w-[200px]">
                                    {config.skills.map((skill) => (
                                        <span key={skill} className={cx("rounded px-2 py-0.5 text-xs font-semibold", SKILL_COLORS[skill] ?? "bg-secondary text-secondary")}>
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex w-full gap-3">
                            <Button className="flex-1" color="secondary" onClick={handleExit}>
                                Batal
                            </Button>
                            <Button className="flex-1" onClick={startExam}>
                                Mulai Ujian
                            </Button>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="flex min-h-dvh flex-col bg-primary">
            <header className="sticky top-0 z-30 border-b border-secondary bg-primary px-4 py-3 md:px-8">
                <div className="mx-auto flex w-full max-w-container items-center justify-between">
                    <div className="flex items-center gap-2 md:gap-4">
                        <button
                            onClick={() => setIsExitModalOpen(true)}
                            className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-secondary transition-colors"
                        >
                            <Image src="/logo.png" className="object-contain animate-in fade-in zoom-in duration-200" alt="GatrAI Logo" width={28} height={28} />
                        </button>
                        <hr className="h-4 w-px bg-border-secondary md:h-6" />
                        <span className="text-xs font-semibold text-primary md:text-sm">
                            {currentQuestionIndex + 1}/{questions.length}
                        </span>
                    </div>

                    <div className="hidden items-center gap-2 md:flex">
                        <ProgressBar value={((currentQuestionIndex + 1) / questions.length) * 100} className="w-40" />
                        <span className="text-xs font-medium text-tertiary">{Math.round(((currentQuestionIndex + 1) / questions.length) * 100)}%</span>
                    </div>

                    <div className="flex items-center gap-2.5">
                        <ThemeToggle />
                        {isAuthenticated && (
                            <div className="hidden md:block">
                                <PlaygroundUserDropdown />
                            </div>
                        )}
                        <Button className="md:hidden" color="secondary" size="sm" iconLeading={LayoutGrid02} onClick={() => setIsMobileMenuOpen(true)} />
                    </div>
                </div>
            </header>

            {/* Mobile Navigation Drawer */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 z-40 flex items-end justify-center bg-overlay/40 backdrop-blur-sm md:hidden">
                    <div className="w-full bg-primary rounded-t-3xl p-6 shadow-2xl animate-in slide-in-from-bottom duration-300">
                        <div className="mx-auto mb-4 h-1 w-12 rounded-full bg-secondary" onClick={() => setIsMobileMenuOpen(false)} />
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-semibold text-primary">Jump to Question</h3>
                            <Button size="sm" color="tertiary" onClick={() => setIsMobileMenuOpen(false)}>Close</Button>
                        </div>
                        <div className="grid grid-cols-5 gap-3 max-h-[60vh] overflow-y-auto pb-8">
                            {questions.map((_, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => {
                                        goToQuestion(idx);
                                        setIsMobileMenuOpen(false);
                                    }}
                                    className={cx(
                                        "flex aspect-square items-center justify-center rounded-xl text-sm font-semibold transition-all",
                                        currentQuestionIndex === idx
                                            ? "bg-brand-solid text-white shadow-md scale-105"
                                            : userAnswers[questions[idx].id]
                                                ? "bg-brand-soft text-brand-700 font-bold"
                                                : "bg-secondary text-secondary hover:bg-tertiary"
                                    )}
                                >
                                    {idx + 1}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <main className="mx-auto flex w-full max-w-container flex-1 flex-col gap-6 px-4 py-6 md:flex-row md:gap-8 md:px-8 md:py-8">
                <aside className="hidden h-fit w-64 shrink-0 flex-col gap-4 rounded-xl border border-secondary p-4 md:flex">
                    <h3 className="text-sm font-semibold text-secondary uppercase tracking-wider">Questions</h3>
                    <div className="grid grid-cols-5 gap-2">
                        {questions.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => goToQuestion(idx)}
                                className={cx(
                                    "flex size-9 items-center justify-center rounded-lg text-sm font-medium transition-colors cursor-pointer",
                                    currentQuestionIndex === idx
                                        ? "bg-brand-solid text-white shadow-sm"
                                        : userAnswers[questions[idx].id]
                                            ? "bg-brand-soft text-brand-700"
                                            : "bg-secondary text-secondary hover:bg-tertiary"
                                )}
                            >
                                {idx + 1}
                            </button>
                        ))}
                    </div>

                    {/* Ads for free users */}
                    {showAds && !isDismissed && (
                        <AdsCard
                            ad={ADS[currentAdIndex % ADS.length]}
                            onDismiss={() => {
                                if (currentAdIndex < ADS.length - 1) {
                                    setCurrentAdIndex(prev => prev + 1);
                                } else {
                                    setIsDismissed(true);
                                }
                            }}
                        />
                    )}
                </aside>

                <section className="flex flex-1 flex-col gap-8">
                    <div className="flex flex-col gap-4 md:gap-6 rounded-2xl border border-secondary bg-primary p-5 shadow-xs md:p-10">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="rounded-full bg-brand-soft px-2.5 py-0.5 text-[10px] md:text-xs font-semibold text-brand-700">
                                    {currentQuestion.skill}
                                </span>
                            </div>
                            {/* <Button color="tertiary" size="sm" iconLeading={Flag01} className="max-md:px-2" /> */}
                        </div>

                        <div className="flex flex-col gap-4 md:gap-6">
                            {currentQuestion.skill.toLowerCase() === "listening" ? (
                                <AudioPlayer key={currentQuestion.id} text={currentQuestion.description} language={config.language} />
                            ) : currentQuestion.skill.toLowerCase() === "writing" ? (
                                <div className="flex flex-col gap-6">
                                    <div className="text-md md:text-lg font-medium text-primary leading-relaxed">
                                        {(() => {
                                            // Split by [blank] OR a sequence of 3 or more underscores
                                            const parts = currentQuestion.description.split(/\[blank\]|_{3,}/g);
                                            if (parts.length === 1) return <Markdown content={currentQuestion.description} />;

                                            // Handle multiple blanks
                                            const currentAnswers = (() => {
                                                try {
                                                    const parsed = JSON.parse(userAnswers[currentQuestion.id] || "[]");
                                                    return Array.isArray(parsed) ? parsed : [userAnswers[currentQuestion.id] || ""];
                                                } catch {
                                                    return [userAnswers[currentQuestion.id] || ""];
                                                }
                                            })();

                                            return parts.map((part, index) => (
                                                <span key={index}>
                                                    <Markdown content={part} className="inline prose-p:inline" />
                                                    {index < parts.length - 1 && (
                                                        <input
                                                            type="text"
                                                            value={currentAnswers[index] || ""}
                                                            onChange={(e) => {
                                                                const newAnswers = [...currentAnswers];
                                                                // Ensure array is large enough
                                                                while (newAnswers.length <= index) newAnswers.push("");
                                                                newAnswers[index] = e.target.value;
                                                                setAnswer(currentQuestion.id, JSON.stringify(newAnswers));
                                                            }}
                                                            className="mx-1 inline-block h-8 min-w-[120px] rounded-md border border-secondary bg-secondary/50 px-2 text-sm text-primary outline-hidden ring-brand focus:ring-2"
                                                            placeholder="..."
                                                        />
                                                    )}
                                                </span>
                                            ));
                                        })()}
                                    </div>
                                    <p className="text-xs text-tertiary italic">Type directly into the blank spaces above.</p>
                                </div>
                            ) : (
                                <Markdown content={currentQuestion.description} className="text-md md:text-lg font-medium text-primary" />
                            )}
                        </div>

                        <div className="mt-2 md:mt-4">
                            {currentQuestion.skill.toLowerCase() === "speaking" ? (
                                <SpeakingInput
                                    value={userAnswers[currentQuestion.id] || ""}
                                    onChange={(val) => setAnswer(currentQuestion.id, val)}
                                    language={config.language}
                                    isRecording={isRecording}
                                    setIsRecording={setIsRecording}
                                />
                            ) : currentQuestion.skill.toLowerCase() === "writing" ? null : currentQuestion.options ? (
                                <QuestionOptions
                                    options={currentQuestion.options || []}
                                    value={userAnswers[currentQuestion.id] || ""}
                                    onChange={(val: string) => setAnswer(currentQuestion.id, val)}
                                />
                            ) : (
                                <textarea
                                    className="w-full min-h-[150px] md:min-h-[200px] rounded-xl border border-secondary bg-primary p-4 text-sm md:text-md text-primary outline-hidden ring-brand focus:ring-2"
                                    placeholder="Type your answer here..."
                                    value={userAnswers[currentQuestion.id] || ""}
                                    onChange={(e) => setAnswer(currentQuestion.id, e.target.value)}
                                />
                            )}
                        </div>
                    </div>

                    {/* Ads for free users (mobile - below question card) */}
                    {showAds && !isDismissed && (
                        <div className="md:hidden">
                            <AdsCard
                                ad={ADS[currentAdIndex % ADS.length]}
                                onDismiss={() => {
                                    if (currentAdIndex < ADS.length - 1) {
                                        setCurrentAdIndex(prev => prev + 1);
                                    } else {
                                        setIsDismissed(true);
                                    }
                                }}
                            />
                        </div>
                    )}

                    <div className="flex items-center justify-between mt-auto gap-4">
                        <Button
                            color="secondary"
                            size="lg"
                            iconLeading={ArrowLeft}
                            isDisabled={currentQuestionIndex === 0}
                            onClick={prevQuestion}
                            className="flex-1 md:flex-initial"
                        >
                            <span className="hidden sm:inline">Previous</span>
                        </Button>

                        {isLastQuestion ? (
                            <Button
                                size="lg"
                                color="primary"
                                iconTrailing={CheckCircle}
                                onClick={() => setIsConfirmModalOpen(true)}
                                className="flex-1 md:flex-initial"
                            >
                                Finish Exam
                            </Button>
                        ) : (
                            <Button
                                size="lg"
                                color="primary"
                                iconTrailing={ArrowRight}
                                onClick={nextQuestion}
                                className="flex-1 md:flex-initial"
                            >
                                <span className="hidden sm:inline">Next Question</span>
                                <span className="sm:hidden">Next</span>
                            </Button>
                        )}
                    </div>
                </section>
            </main>
            <ModalOverlay isDismissable isOpen={isConfirmModalOpen} onOpenChange={setIsConfirmModalOpen}>
                <Modal>
                    <Dialog>
                        <div className="relative w-full overflow-hidden rounded-2xl bg-primary shadow-xl sm:max-w-md">
                            <div className="flex flex-col gap-4 px-4 pt-5 sm:flex-row sm:px-6 sm:pt-6">
                                <div className="flex-shrink-0">
                                    <FeaturedIcon icon={CheckCircle} color="brand" theme="light" size="lg" />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <AriaHeading slot="title" className="text-lg font-semibold text-primary">
                                        Finish Exam?
                                    </AriaHeading>
                                    <p className="text-sm text-tertiary">
                                        Are you sure you want to finish the exam? You won't be able to change your answers after this.
                                    </p>
                                </div>
                            </div>
                            <div className="flex flex-col-reverse gap-3 p-4 pt-6 sm:flex-row sm:px-6 sm:pb-6">
                                <Button color="secondary" size="lg" onClick={() => setIsConfirmModalOpen(false)} className="flex-1">
                                    Cancel
                                </Button>
                                <Button
                                    color="primary"
                                    size="lg"
                                    onClick={() => {
                                        setIsConfirmModalOpen(false);
                                        finishExam();
                                        router.push(`/result/${activeExam.id}`);
                                    }}
                                    className="flex-1"
                                >
                                    Yes, Finish
                                </Button>
                            </div>
                        </div>
                    </Dialog>
                </Modal>
            </ModalOverlay>

            <ModalOverlay isDismissable isOpen={isExitModalOpen} onOpenChange={setIsExitModalOpen}>
                <Modal>
                    <Dialog>
                        <div className="relative w-full overflow-hidden rounded-2xl bg-primary shadow-xl sm:max-w-md animate-in fade-in duration-200">
                            <div className="flex flex-col gap-4 px-4 pt-5 sm:flex-row sm:px-6 sm:pt-6">
                                <div className="flex-shrink-0">
                                    <FeaturedIcon icon={LogOut01} color="error" theme="light" size="lg" />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <AriaHeading slot="title" className="text-lg font-semibold text-primary">
                                        Keluar dari Ujian?
                                    </AriaHeading>
                                    <p className="text-sm text-tertiary">
                                        Apakah kamu yakin ingin keluar? Ujian ini akan otomatis disimpan dan kamu dapat melanjutkannya nanti di Playground.
                                    </p>
                                </div>
                            </div>
                            <div className="flex flex-col-reverse gap-3 p-4 pt-6 sm:flex-row sm:px-6 sm:pb-6">
                                <Button color="secondary" size="lg" onClick={() => setIsExitModalOpen(false)} className="flex-1">
                                    Batal
                                </Button>
                                <Button
                                    color="primary-destructive"
                                    size="lg"
                                    onClick={() => {
                                        setIsExitModalOpen(false);
                                        handleExit();
                                    }}
                                    className="flex-1 font-semibold"
                                >
                                    Ya, Keluar
                                </Button>
                            </div>
                        </div>
                    </Dialog>
                </Modal>
            </ModalOverlay>
        </div>
    );
};
