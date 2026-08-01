import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/api/auth";
import { COOKIE_NAME } from "@/lib/auth-cookie";
import { SkillType } from "@/store/use-exam-store";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Try to authenticate the user
        const token = req.cookies.get(COOKIE_NAME)?.value;
        const decodedUser = token ? verifyToken(token) : null;
        const dbUser = decodedUser ? await prisma.user.findUnique({ where: { email: decodedUser.email } }) : null;

        let exam = await prisma.exam.findUnique({
            where: { id },
            include: { questions: true }
        });

        if (!exam) {
            return NextResponse.json({ error: "Exam not found" }, { status: 404 });
        }

        // If authenticated and the current user is NOT the owner of the exam,
        // we check if they already have an attempt, or clone it for them.
        if (dbUser && exam.userId !== dbUser.id) {
            // Find existing cloned attempt
            let attempt = await prisma.exam.findFirst({
                where: {
                    userId: dbUser.id,
                    originalExamId: exam.id
                },
                include: { questions: true }
            });

            // If no attempt, create a cloned attempt
            if (!attempt) {
                attempt = await prisma.exam.create({
                    data: {
                        userId: dbUser.id,
                        originalExamId: exam.id,
                        language: exam.language,
                        skills: exam.skills,
                        provider: exam.provider,
                        modelName: exam.modelName,
                        status: "ongoing"
                    },
                    include: { questions: true }
                });

                // Clone questions
                await prisma.question.createMany({
                    data: exam.questions.map((q) => ({
                        examId: attempt!.id,
                        content: q.content,
                        type: q.type
                    }))
                });

                // Fetch cloned attempt with newly cloned questions
                attempt = await prisma.exam.findUnique({
                    where: { id: attempt.id },
                    include: { questions: true }
                }) as any;
            }

            exam = attempt;
        }

        // Map database model to Zustand ExamAttempt model
        const mappedQuestions = exam!.questions.map((q) => {
            let description = q.content;
            let options: string[] | null = null;
            let answer = q.answer || "";

            // If q.content is saved as JSON, parse it
            if (q.content.trim().startsWith("{")) {
                try {
                    const parsed = JSON.parse(q.content);
                    description = parsed.description || parsed.content || q.content;
                    options = parsed.options || null;
                    if (parsed.answer) {
                        answer = parsed.answer;
                    }
                } catch {
                    // Fallback to raw content if parsing fails
                }
            }

            const skill = (q.type.charAt(0).toUpperCase() + q.type.slice(1)) as SkillType;

            return {
                id: q.id,
                description,
                options,
                answer,
                skill
            };
        });

        const examAttempt = {
            id: exam!.id,
            createdAt: exam!.createdAt.getTime(),
            config: {
                language: exam!.language,
                questionCount: exam!.questions.length,
                skills: exam!.skills as SkillType[]
            },
            questions: mappedQuestions,
            userAnswers: exam!.questions.reduce((acc: any, q) => {
                // If they have already answered questions, populate them
                if (q.answer) {
                    acc[q.id] = q.answer;
                }
                return acc;
            }, {}),
            status: exam!.status as any,
            currentQuestionIndex: 0,
            startTime: null,
            endTime: null,
            ownedBy: exam!.userId === dbUser?.id ? undefined : exam!.userId // mark as invited if not owner
        };

        return NextResponse.json({ exam: examAttempt });
    } catch (error: any) {
        console.error("Failed to fetch exam:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
