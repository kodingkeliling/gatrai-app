import { prisma } from "../prisma";
import { checkAIProviderStatus } from "@/actions/ai-status";

export const PROTECTED_TOOLS = [
    "list_exams",
    "get_exam",
    "get_users",
    "create_quiz_draft",
    "add_questions_to_quiz",
    "commit_quiz"
];

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://gatrai.kodingkeliling.com";

export const TOOLS_LIST = [
    {
        name: "get_ai_status",
        description: "Check the connection status of AI providers configured in GatrAI",
        inputSchema: {
            type: "object",
            properties: {
                provider: {
                    type: "string",
                    enum: ["gemini", "groq", "openai", "anthropic", "openrouter"],
                    description: "The AI provider to check status for"
                }
            },
            required: ["provider"]
        }
    },
    {
        name: "list_exams",
        description: "List recent quizzes (exams) (Protected)",
        inputSchema: {
            type: "object",
            properties: {
                limit: {
                    type: "number",
                    description: "Maximum number of quizzes to retrieve",
                    default: 10
                }
            }
        }
    },
    {
        name: "get_exam",
        description: "Get details of a specific quiz (exam) by ID, including its questions and scores (Protected)",
        inputSchema: {
            type: "object",
            properties: {
                examId: {
                    type: "string",
                    description: "The unique identifier of the quiz"
                }
            },
            required: ["examId"]
        }
    },
    {
        name: "get_users",
        description: "List users registered in GatrAI (Protected, Admin-only)",
        inputSchema: {
            type: "object",
            properties: {
                limit: {
                    type: "number",
                    description: "Maximum number of users to retrieve",
                    default: 20
                }
            }
        }
    },
    {
        name: "create_quiz_draft",
        description: "Create a new quiz draft (Protected). Always call this first to start creating a quiz as a draft before saving.",
        inputSchema: {
            type: "object",
            properties: {
                language: {
                    type: "string",
                    description: "The language to be tested (e.g., English, Japanese, Korean)"
                },
                skills: {
                    type: "array",
                    items: {
                        type: "string",
                        enum: ["Reading", "Writing", "Speaking", "Listening"]
                    },
                    description: "The language skills to test"
                },
                provider: {
                    type: "string",
                    description: "AI provider used (optional)"
                },
                modelName: {
                    type: "string",
                    description: "AI model name used (optional)"
                }
            },
            required: ["language", "skills"]
        }
    },
    {
        name: "add_questions_to_quiz",
        description: "Add questions to an existing quiz draft (Protected).",
        inputSchema: {
            type: "object",
            properties: {
                quizId: {
                    type: "string",
                    description: "The unique identifier of the quiz"
                },
                questions: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            content: {
                                type: "string",
                                description: "The question text, prompt, or structure"
                            },
                            type: {
                                type: "string",
                                enum: ["reading", "writing", "speaking", "listening"],
                                description: "The type of language skill this question tests"
                            }
                        },
                        required: ["content", "type"]
                    },
                    description: "List of questions to add"
                }
            },
            required: ["quizId", "questions"]
        }
    },
    {
        name: "commit_quiz",
        description: "Finalize and save the quiz (Protected). Call this when the user confirms saving/finalizing the draft.",
        inputSchema: {
            type: "object",
            properties: {
                quizId: {
                    type: "string",
                    description: "The unique identifier of the quiz to commit"
                }
            },
            required: ["quizId"]
        }
    }
];

export async function executeTool(
    name: string,
    args: any,
    userId: string | null
): Promise<any> {
    // 1. Authorization check for protected tools
    if (PROTECTED_TOOLS.includes(name) && !userId) {
        throw new Error("UNAUTHORIZED");
    }

    switch (name) {
        case "get_ai_status": {
            const provider = args.provider;
            const status = await checkAIProviderStatus(provider);
            return {
                content: [
                    {
                        type: "text",
                        text: `AI Provider "${provider}" status is: ${status}`
                    }
                ]
            };
        }

        case "list_exams": {
            const limit = args.limit || 10;
            const user = await prisma.user.findUnique({
                where: { id: userId! }
            });

            if (!user) {
                throw new Error("User not found");
            }

            const exams = await prisma.exam.findMany({
                where: user.role === "SUPER_ADMIN" ? {} : { userId: user.id },
                take: limit,
                orderBy: { createdAt: "desc" },
                select: {
                    id: true,
                    language: true,
                    skills: true,
                    provider: true,
                    status: true,
                    createdAt: true
                }
            });

            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify(exams.map(e => ({
                            ...e,
                            url: `${APP_URL}/playground/${e.id}`
                        })), null, 2)
                    }
                ]
            };
        }

        case "get_exam": {
            const examId = args.examId;
            const user = await prisma.user.findUnique({
                where: { id: userId! }
            });

            if (!user) {
                throw new Error("User not found");
            }

            const exam = await prisma.exam.findUnique({
                where: { id: examId },
                include: {
                    questions: {
                        select: {
                            id: true,
                            type: true,
                            content: true,
                            answer: true,
                            score: true
                        }
                    }
                }
            });

            if (!exam) {
                return {
                    content: [{ type: "text", text: `Quiz with ID ${examId} not found.` }],
                    isError: true
                };
            }

            if (user.role !== "SUPER_ADMIN" && exam.userId !== user.id) {
                throw new Error("UNAUTHORIZED");
            }

            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify({
                            ...exam,
                            url: `${APP_URL}/playground/${exam.id}`
                        }, null, 2)
                    }
                ]
            };
        }

        case "get_users": {
            const limit = args.limit || 20;
            const user = await prisma.user.findUnique({
                where: { id: userId! }
            });

            if (!user || user.role !== "SUPER_ADMIN") {
                throw new Error("FORBIDDEN: Admin permission required");
            }

            const users = await prisma.user.findMany({
                take: limit,
                orderBy: { createdAt: "desc" },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    planId: true,
                    isVerified: true,
                    createdAt: true
                }
            });

            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify(users, null, 2)
                    }
                ]
            };
        }

        case "create_quiz_draft": {
            const { language, skills, provider = "auto", modelName } = args;

            const exam = await prisma.exam.create({
                data: {
                    userId: userId!,
                    language,
                    skills,
                    provider,
                    modelName: modelName || null,
                    status: "ongoing" // draft
                }
            });

            const quizUrl = `${APP_URL}/playground/${exam.id}`;

            return {
                content: [
                    {
                        type: "text",
                        text: `Quiz draft created successfully.\nQuiz ID: ${exam.id}\nStatus: ongoing (draft)\nURL: ${quizUrl}\n\nYou can now add questions using add_questions_to_quiz.`
                    }
                ]
            };
        }

        case "add_questions_to_quiz": {
            const { quizId, questions } = args;

            // Check access
            const exam = await prisma.exam.findUnique({
                where: { id: quizId }
            });

            if (!exam) {
                return {
                    content: [{ type: "text", text: `Quiz with ID ${quizId} not found.` }],
                    isError: true
                };
            }

            if (exam.userId !== userId) {
                throw new Error("UNAUTHORIZED");
            }

            // Create questions
            await prisma.question.createMany({
                data: questions.map((q: any) => ({
                    examId: quizId,
                    content: q.content,
                    type: q.type
                }))
            });

            const quizUrl = `${APP_URL}/playground/${quizId}`;

            return {
                content: [
                    {
                        type: "text",
                        text: `Successfully added ${questions.length} questions to Quiz Draft.\nURL to view/try: ${quizUrl}`
                    }
                ]
            };
        }

        case "commit_quiz": {
            const { quizId } = args;

            const exam = await prisma.exam.findUnique({
                where: { id: quizId }
            });

            if (!exam) {
                return {
                    content: [{ type: "text", text: `Quiz with ID ${quizId} not found.` }],
                    isError: true
                };
            }

            if (exam.userId !== userId) {
                throw new Error("UNAUTHORIZED");
            }

            // Set status to completed (finalized)
            const updated = await prisma.exam.update({
                where: { id: quizId },
                data: { status: "completed" }
            });

            const quizUrl = `${APP_URL}/playground/${quizId}`;

            return {
                content: [
                    {
                        type: "text",
                        text: `Quiz committed and saved successfully!\nStatus: ${updated.status}\nURL to try: ${quizUrl}`
                    }
                ]
            };
        }

        default:
            throw new Error(`Unknown tool: ${name}`);
    }
}
