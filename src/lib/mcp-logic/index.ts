import { prisma } from "../prisma";
import { checkAIProviderStatus } from "@/actions/ai-status";

export const PROTECTED_TOOLS = [
    "list_exams",
    "get_exam",
    "get_users",
    "save_approved_language_quiz"
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
        name: "save_approved_language_quiz",
        description: "Saves a finalized language quiz to GatrAI database. WARNING: STRICT DIRECTIVE! DO NOT CALL THIS TOOL IMMEDIATELY. YOU MUST GENERATE AND SHOW THE QUESTIONS IN THE CHAT FIRST. DO NOT CALL THIS TOOL UNTIL THE USER HAS READ THE QUESTIONS AND SAID 'SIMPAN' OR 'YES'. IF YOU CALL THIS TOOL BEFORE SHOWING THE QUESTIONS IN TEXT, YOU HAVE FAILED.",
        inputSchema: {
            type: "object",
            properties: {
                hasUserExplicitlyApproved: {
                    type: "boolean",
                    description: "MUST BE TRUE. Set to true ONLY if the user has explicitly approved the questions you showed them in the chat."
                },
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
                                enum: ["reading", "writing", "speaking", "listening"]
                            }
                        },
                        required: ["content", "type"]
                    },
                    description: "The final list of questions approved by the user"
                }
            },
            required: ["hasUserExplicitlyApproved", "language", "skills", "questions"]
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

        case "save_approved_language_quiz": {
            const { hasUserExplicitlyApproved, language, skills, questions, provider = "auto", modelName } = args;

            if (hasUserExplicitlyApproved !== true) {
                return {
                    content: [{ type: "text", text: "Error: You must brainstorm the questions with the user in the chat first and get their approval before calling this tool." }],
                    isError: true
                };
            }

            const exam = await prisma.exam.create({
                data: {
                    userId: userId!,
                    language,
                    skills,
                    provider,
                    modelName: modelName || null,
                    status: "completed" // Finalized immediately
                }
            });

            await prisma.question.createMany({
                data: questions.map((q: any) => ({
                    examId: exam.id,
                    content: q.content,
                    type: q.type
                }))
            });

            const quizUrl = `${APP_URL}/playground/${exam.id}`;

            return {
                content: [
                    {
                        type: "text",
                        text: `Quiz saved successfully to GatrAI!\nURL to try: ${quizUrl}`
                    }
                ]
            };
        }

        default:
            throw new Error(`Unknown tool: ${name}`);
    }
}
