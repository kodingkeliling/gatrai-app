import { prisma } from "../prisma";
import { checkAIProviderStatus } from "@/actions/ai-status";

export const PROTECTED_TOOLS = ["list_exams", "get_exam", "get_users"];

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
        description: "List recent language testing exams (Protected)",
        inputSchema: {
            type: "object",
            properties: {
                limit: {
                    type: "number",
                    description: "Maximum number of exams to retrieve",
                    default: 10
                }
            }
        }
    },
    {
        name: "get_exam",
        description: "Get detail of a specific exam by ID, including its questions and scores (Protected)",
        inputSchema: {
            type: "object",
            properties: {
                examId: {
                    type: "string",
                    description: "The unique identifier of the exam"
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
            // Return exams for the authenticated user (or all if admin, but let's scope to the user's own exams or all if user exists)
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
                        text: JSON.stringify(exams, null, 2)
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
                    content: [{ type: "text", text: `Exam with ID ${examId} not found.` }],
                    isError: true
                };
            }

            // Scoping: Only allow access if user is admin or owns the exam
            if (user.role !== "SUPER_ADMIN" && exam.userId !== user.id) {
                throw new Error("UNAUTHORIZED");
            }

            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify(exam, null, 2)
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

        default:
            throw new Error(`Unknown tool: ${name}`);
    }
}
