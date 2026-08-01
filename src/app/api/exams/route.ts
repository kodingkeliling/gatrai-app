import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/api/auth";
import { COOKIE_NAME } from "@/lib/auth-cookie";
import { SkillType } from "@/store/use-exam-store";

export async function GET(req: NextRequest) {
    try {
        const token = req.cookies.get(COOKIE_NAME)?.value;
        const decodedUser = token ? verifyToken(token) : null;

        if (!decodedUser) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const dbUser = await prisma.user.findUnique({ where: { email: decodedUser.email } });
        if (!dbUser) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Fetch all exams for the user (original exams or cloned attempts)
        const exams = await prisma.exam.findMany({
            where: { userId: dbUser.id },
            include: { questions: true },
            orderBy: { createdAt: "desc" }
        });

        const mapped = exams.map((exam) => ({
            id: exam.id,
            createdAt: exam.createdAt.getTime(),
            config: {
                language: exam.language,
                questionCount: exam.questions.length,
                skills: exam.skills as SkillType[]
            },
            questions: exam.questions.map((q) => {
                let description = q.content;
                let options: string[] | null = null;
                let answer = q.answer || "";
                const skill = (q.type.charAt(0).toUpperCase() + q.type.slice(1)) as SkillType;

                if (q.content.trim().startsWith("{")) {
                    try {
                        const parsed = JSON.parse(q.content);
                        description = parsed.description || q.content;
                        options = parsed.options || null;
                        answer = parsed.answer || "";
                    } catch {}
                }

                return { id: q.id, description, options, answer, skill };
            }),
            userAnswers: exam.questions.reduce((acc: Record<string, string>, q) => {
                if (q.answer) acc[q.id] = q.answer;
                return acc;
            }, {}),
            status: exam.status as any,
            currentQuestionIndex: 0,
            startTime: null,
            endTime: null
        }));

        return NextResponse.json({ exams: mapped });
    } catch (error: any) {
        console.error("Failed to fetch user exams:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
