"use client";

import { useRouter } from "next/navigation";
import { BookClosed, BookOpen01, Clock, Zap, Home01 } from "@untitledui/icons";
import { MetricsIcon03 } from "@/components/application/metrics/metrics";
import { DataTable } from "@/components/shared/data-table";
import { Badge } from "@/components/base/badges/badges";
import { useExamStore, type ExamAttempt } from "@/store/use-exam-store";
import { useAuthStore } from "@/store/use-auth-store";
import { Button } from "@/components/base/buttons/button";
import { DashboardPageHeader } from "@/components/dashboard/page-header";

const EXAM_COLUMNS = [
    {
        key: "title",
        label: "Ujian",
        sortable: true,
        render: (row: ExamAttempt) => (
            <div className="flex flex-col gap-0.5">
                <span className="font-medium text-primary">
                    {row.config.questionCount} Soal — {row.config.language}
                </span>
                <span className="text-xs text-tertiary">
                    {row.config.skills.join(", ")}
                </span>
            </div>
        ),
    },
    {
        key: "status",
        label: "Status",
        render: (row: ExamAttempt) => (
            <Badge
                color={row.status === "completed" ? "success" : "warning"}
                type="pill-color"
                size="sm"
            >
                {row.status === "completed" ? "Selesai" : "Berlangsung"}
            </Badge>
        ),
    },
    {
        key: "createdAt",
        label: "Tanggal",
        sortable: true,
        render: (row: ExamAttempt) => (
            <span className="text-sm text-tertiary">
                {new Date(row.createdAt).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                })}
            </span>
        ),
    },
];

export default function DashboardPage() {
    const router = useRouter();
    const { user } = useAuthStore();
    const { exams, deleteExam } = useExamStore();

    const completed = exams.filter((e) => e.status === "completed").length;
    const ongoing = exams.filter((e) => e.status === "ongoing").length;
    const totalQuestions = exams.reduce((acc, e) => acc + e.questions.length, 0);

    const recentExams = [...exams]
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, 10);

    return (
        <div className="flex flex-col gap-8">
            <DashboardPageHeader
                icon={Home01}
                title={`Selamat datang, ${user?.name?.split(" ")[0] || user?.email?.split("@")[0] || "—"} 👋`}
                description="Berikut ringkasan aktivitas ujian Anda."
            />

            {/* Metrics */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <MetricsIcon03
                    icon={BookClosed}
                    subtitle="Total Ujian Dikerjakan"
                    title={String(exams.length)}
                    change=""
                    changeTrend="positive"
                    actions={false}
                />
                <MetricsIcon03
                    icon={BookOpen01}
                    subtitle="Total Soal Dikerjakan"
                    title={String(totalQuestions)}
                    change=""
                    changeTrend="positive"
                    actions={false}
                />
                <MetricsIcon03
                    icon={Zap}
                    subtitle="Sisa Token"
                    title="10 / 50" // Sample token text
                    change=""
                    changeTrend="negative"
                    actions={false}
                    footer={
                        <Button
                            size="sm"
                            color="secondary"
                            onClick={() => router.push("/pricing")}
                        >
                            Beli Token
                        </Button>
                    }
                />
            </div>

            {/* Recent exams table */}
            <DataTable
                title="Ujian Terbaru"
                description="10 ujian paling baru"
                badge={recentExams.length}
                columns={EXAM_COLUMNS}
                data={recentExams}
                searchable={false}
                rowActions={true}
                onEdit={(row) => router.push(`/dashboard/exams/${row.id}`)}
                onDelete={(row) => deleteExam(row.id)}
                onRowClick={(row) => router.push(`/dashboard/exams/${row.id}`)}
                emptyState={
                    <div className="flex items-center gap-2 py-2 text-sm text-tertiary">
                        <Clock className="size-4" />
                        Belum ada ujian. Mulai dari halaman Ujian.
                    </div>
                }
            />
        </div>
    );
}
