import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/api/auth";
import { COOKIE_NAME } from "@/lib/auth-cookie";

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { userAnswers, status } = await req.json();

        // Try to authenticate the user
        const token = req.cookies.get(COOKIE_NAME)?.value;
        const decodedUser = token ? verifyToken(token) : null;
        const dbUser = decodedUser ? await prisma.user.findUnique({ where: { email: decodedUser.email } }) : null;

        if (!dbUser) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const exam = await prisma.exam.findUnique({
            where: { id },
            include: { questions: true }
        });

        if (!exam) {
            return NextResponse.json({ error: "Exam not found" }, { status: 404 });
        }

        // Verify the user owns this exam (either original or cloned attempt)
        if (exam.userId !== dbUser.id) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Update exam status
        await prisma.exam.update({
            where: { id: exam.id },
            data: { status: status || "completed" }
        });

        // Update answers for each question
        if (userAnswers) {
            for (const questionId of Object.keys(userAnswers)) {
                const answer = userAnswers[questionId];

                // Find the question to get correct answer and compute score
                const dbQuestion = exam.questions.find(q => q.id === questionId);
                let score = 0;

                if (dbQuestion) {
                    let correctAnswer = dbQuestion.answer || "";
                    if (dbQuestion.content.trim().startsWith("{")) {
                        try {
                            const parsed = JSON.parse(dbQuestion.content);
                            correctAnswer = parsed.answer || dbQuestion.answer || "";
                        } catch {}
                    }

                    // Compute simple score (1.0 for correct, 0.0 for incorrect)
                    if (correctAnswer && answer && correctAnswer.trim().toLowerCase() === answer.trim().toLowerCase()) {
                        score = 1.0;
                    }
                }

                await prisma.question.update({
                    where: { id: questionId },
                    data: {
                        answer,
                        score
                    }
                });
            }
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Failed to submit exam:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
