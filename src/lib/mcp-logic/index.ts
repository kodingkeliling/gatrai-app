import { prisma } from "../prisma";
import { checkAIProviderStatus } from "@/actions/ai-status";

export const PROTECTED_TOOLS = [
    "list_exams",
    "get_exam",
    "get_users",
    "save_approved_language_quiz",
    "analyze_exam_participants"
];

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://gatrai.kodingkeliling.com";

export const TOOLS_LIST = [
    {
        name: "get_language_quiz_template",
        description: "Returns the strict guidelines and structured template for creating language quiz questions to ensure consistency with GatrAI's platform.",
        inputSchema: {
            type: "object",
            properties: {}
        }
    },
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
        description: "Saves a finalized language quiz to GatrAI database. IMPORTANT WORKFLOW: 1) When user asks to make a quiz, DO NOT call tools. Instead, give them a template prompt to fill (Language, Skills, Questions count) and say you will brainstorm together. 2) Once user fills it, generate the questions IN THE CHAT without calling any tools. 3) Wait for user to read and say 'simpan' or 'save'. 4) ONLY THEN call this tool to save and return the playground URL.",
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
    },
    {
        name: "analyze_exam_participants",
        description: "Analyze participants who have taken a specific exam. Provides completion details, scores, answers, and detail analysis of their attempts.",
        inputSchema: {
            type: "object",
            properties: {
                examId: {
                    type: "string",
                    description: "The original exam/quiz ID to analyze (e.g. the ID returned when saving the quiz)."
                }
            },
            required: ["examId"]
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
        case "get_language_quiz_template": {
            return {
                content: [
                    {
                        type: "text",
                        text: `GatrAI Quiz Generation Guidelines:

Each question MUST be created in a clean JSON format before showing it to the user.
Do not output anything other than the JSON format when saving, but for brainstorming with the user, you must follow this template.

Guidelines per skill:
- Reading: Short text passage followed by a multiple choice question with exactly 4 options.
- Listening: Conversation or speech transcript featuring 'MALE:', 'FEMALE:', or 'NARRATOR:' labels, followed by a multiple choice question with exactly 4 options.
- Writing: Sentence containing a translation task or blank fill-in using the exact term '[blank]' (e.g. "I want to [blank] water" with answer "drink"). Set options to null.
- Speaking: Short sentence in the target language for the user to read aloud. Set options to null. The answer field must match the exact transcript.

JSON Question Structure for the 'save_approved_language_quiz' tool:
{
  "content": "JSON string containing the question details. This must be stringified",
  "type": "reading | writing | speaking | listening"
}

The "content" field of each question object must be a JSON string with the following structure:
{
  "description": "The main question prompt, text, blank sentence, or conversation transcript. Use HTML tags like <b>, <i>, <br> for styling.",
  "options": ["Option A", "Option B", "Option C", "Option D"] // or null for writing/speaking
  "answer": "Correct option or correct answer text"
}

Example for Reading:
{
  "description": "Read the text and choose the correct answer: <br/> Budi pergi ke pasar untuk membeli buah. Apa yang dibeli Budi?",
  "options": ["Sayuran", "Buah", "Daging", "Ikan"],
  "answer": "Buah"
}

Example for Writing:
{
  "description": "Complete the sentence: <br/> She is a [blank] at the hospital.",
  "options": null,
  "answer": "doctor"
}
`
                    }
                ]
            };
        }

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

        case "analyze_exam_participants": {
            const { examId } = args;

            const originalExam = await prisma.exam.findUnique({
                where: { id: examId }
            });

            if (!originalExam) {
                return {
                    content: [{ type: "text", text: `Error: Exam with ID ${examId} not found.` }],
                    isError: true
                };
            }

            if (originalExam.userId !== userId) {
                return {
                    content: [{ type: "text", text: "Error: You can only analyze participants for exams you created." }],
                    isError: true
                };
            }

            const attempts = await prisma.exam.findMany({
                where: { originalExamId: examId },
                include: {
                    user: {
                        select: {
                            name: true,
                            email: true
                        }
                    },
                    questions: true
                }
            });

            if (attempts.length === 0) {
                return {
                    content: [{ type: "text", text: "No participants have taken this exam yet." }]
                };
            }

            const analysis = attempts.map((attempt) => {
                const totalQuestions = attempt.questions.length;
                const answeredQuestions = attempt.questions.filter((q) => q.answer !== null).length;
                const correctQuestions = attempt.questions.filter((q) => q.score && q.score > 0.5).length;
                
                const scorePercentage = totalQuestions > 0 ? Math.round((correctQuestions / totalQuestions) * 100) : 0;

                const detailQuestions = attempt.questions.map((q) => {
                    let questionText = q.content;
                    let correctAnswer = q.answer || "";
                    if (q.content.trim().startsWith("{")) {
                        try {
                            const parsed = JSON.parse(q.content);
                            questionText = parsed.description || parsed.content || q.content;
                            correctAnswer = parsed.answer || "";
                        } catch {}
                    }

                    return {
                        question: questionText,
                        participantAnswer: q.answer || "(No Answer)",
                        correctAnswer: correctAnswer,
                        isCorrect: q.score ? q.score > 0.5 : false
                    };
                });

                return {
                    participant: {
                        name: attempt.user.name || "Anonymous User",
                        email: attempt.user.email
                    },
                    status: attempt.status,
                    startedAt: attempt.createdAt.toISOString(),
                    progress: `${answeredQuestions}/${totalQuestions} answered`,
                    score: `${scorePercentage}%`,
                    answersDetail: detailQuestions
                };
            });

            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify(analysis, null, 2)
                    }
                ]
            };
        }

        default:
            throw new Error(`Unknown tool: ${name}`);
    }
}
