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
        description: `Saves a finalized language quiz to GatrAI. CRITICAL WORKFLOW RULES:\n1) When user asks to create a quiz, DO NOT call any tools immediately. First call 'get_language_quiz_template' to understand the EXACT format requirements.\n2) Respond with a template prompt for the user to fill in (Language, Skills, Count), then generate questions IN THE CHAT for brainstorming WITHOUT calling any tools.\n3) Wait for user to say 'simpan' or 'save'. ONLY THEN call this tool.\n4) CRITICAL: Each question MUST use the structured fields (description, options, answer, type). NEVER put all question content in a single 'content' string. Reading/Listening MUST have exactly 4 options as an array. Speaking/Writing MUST have options=null.`,
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
                    description: "The structured list of approved questions. MUST use the structured fields — NOT a single 'content' string.",
                    items: {
                        type: "object",
                        properties: {
                            description: {
                                type: "string",
                                description: "The full question text, reading passage, listening transcript, or speaking prompt. HTML tags like <b>, <i>, <br/> are supported. For Listening: MUST include the conversation transcript using MALE:, FEMALE:, NARRATOR: labels, then a 'Question:' line at the end. For Speaking: MUST include the sentence to be read aloud."
                            },
                            options: {
                                type: ["array", "null"],
                                items: { type: "string" },
                                description: "For Reading and Listening: REQUIRED — provide exactly 4 string options. For Speaking and Writing: MUST be null."
                            },
                            answer: {
                                type: "string",
                                description: "The correct answer. For Reading/Listening: must EXACTLY match one of the 4 options strings. For Writing: the correct translation or filled blank (use '|->' to separate multiple blanks). For Speaking: the exact sentence transcript."
                            },
                            type: {
                                type: "string",
                                enum: ["reading", "writing", "speaking", "listening"],
                                description: "The skill type in lowercase."
                            }
                        },
                        required: ["description", "options", "answer", "type"]
                    }
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
                        text: `GatrAI Quiz Question Format Guide

Use this guide BEFORE generating any quiz questions. All questions saved to GatrAI MUST follow this exact structure for them to render correctly in the playground.

Each question in the 'questions' array of 'save_approved_language_quiz' must be an object with these fields:
  - description (string): The full question content — HTML supported (<b>, <i>, <br/>)
  - options (array of 4 strings | null): 4 choices for Reading/Listening; null for Speaking/Writing
  - answer (string): The exact correct answer
  - type (string): "reading" | "writing" | "speaking" | "listening"

════════════════════════════════════════
SKILL: Reading
════════════════════════════════════════
Description: A short reading passage followed by a multiple choice question.
Options: REQUIRED — exactly 4 strings. The correct answer MUST be included verbatim.
Answer: Must EXACTLY match one of the 4 options.

Example:
{
  "description": "<p>Emma wakes up every morning at 6 AM. She eats breakfast and then takes a bus to work. She enjoys reading during the commute.</p><br/><p>How does Emma go to work?</p>",
  "options": ["By car", "By bus", "By train", "On foot"],
  "answer": "By bus",
  "type": "reading"
}

════════════════════════════════════════
SKILL: Listening
════════════════════════════════════════
Description: A conversation transcript using MALE:, FEMALE:, NARRATOR: labels (NEVER translate these), then a 'Question:' line.
Options: REQUIRED — exactly 4 strings.
Answer: Must EXACTLY match one of the 4 options.

Example:
{
  "description": "Listen to the conversation and answer the question.<br/><br/>MALE: Hello, I would like to reserve a table for two tonight at 7 PM.<br/>FEMALE: Of course! May I have your name?<br/>MALE: My name is John Smith.<br/><br/>Question: What is the man trying to do?",
  "options": ["Order food", "Make a reservation", "Cancel a booking", "Ask for directions"],
  "answer": "Make a reservation",
  "type": "listening"
}

════════════════════════════════════════
SKILL: Writing
════════════════════════════════════════
Description: A translation task or fill-in-the-blank sentence. Use [blank] (with square brackets) for blanks — NEVER underscores.
Options: MUST be null.
Answer: The correct translated text or the filled blank word(s). Use '|->' to separate multiple blank answers.

Example (Translation):
{
  "description": "<p><b>Translate to English:</b></p><p>Saya sangat senang bertemu dengan Anda hari ini.</p>",
  "options": null,
  "answer": "I am very happy to meet you today.",
  "type": "writing"
}

Example (Fill in the blank):
{
  "description": "<p>Complete the sentence:</p><p>She works as a [blank] at the hospital and starts her shift at [blank] every morning.</p>",
  "options": null,
  "answer": "doctor|->7 AM",
  "type": "writing"
}

════════════════════════════════════════
SKILL: Speaking
════════════════════════════════════════
Description: A Read Aloud or Listen and Repeat prompt. Include the sentence to say in the description. Keep it natural, 8-20 words.
Options: MUST be null.
Answer: The EXACT sentence text the user must say (used for speech recognition matching).

Example:
{
  "description": "<p><b>Read Aloud:</b> Please say the following sentence clearly.</p><br/><p>\"I would like to order a coffee and a sandwich, please.\"</p>",
  "options": null,
  "answer": "I would like to order a coffee and a sandwich, please.",
  "type": "speaking"
}

════════════════════════════════════════
CRITICAL RULES:
- Reading & Listening: options MUST be an array of exactly 4 strings, never null
- Speaking & Writing: options MUST be null, never an array
- answer for Reading/Listening MUST EXACTLY match one of the 4 options strings character-for-character
- NEVER put all question info in a single content string — always use the 4 separate fields
- Listening description: ALWAYS use MALE: FEMALE: NARRATOR: labels in English only
- Writing blanks: ALWAYS use [blank] in square brackets, NEVER use underscores
════════════════════════════════════════
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

            // Validate and normalize questions format
            const normalizedQuestions = (questions as any[]).map((q: any) => {
                // Support new structured format { description, options, answer, type }
                // Fall back to old single content string format for backwards compatibility
                const type = (q.type || "reading").toLowerCase();
                let content: string;

                if (q.description !== undefined) {
                    // New structured format — serialize into the JSON format the parser understands
                    const isMultiChoice = type === "reading" || type === "listening";
                    let options: string[] | null = null;

                    if (isMultiChoice && Array.isArray(q.options) && q.options.length > 0) {
                        options = q.options.map((o: any) => String(o));
                    } else {
                        options = null;
                    }

                    content = JSON.stringify({
                        description: String(q.description || ""),
                        options,
                        answer: String(q.answer || "")
                    });
                } else if (q.content !== undefined) {
                    // Legacy single content string — store as-is
                    content = String(q.content);
                } else {
                    content = "";
                }

                return { content, type };
            });

            const exam = await prisma.exam.create({
                data: {
                    userId: userId!,
                    language,
                    skills,
                    provider,
                    modelName: modelName || null,
                    status: "ongoing" // Set to ongoing so user can take the quiz
                }
            });

            await prisma.question.createMany({
                data: normalizedQuestions.map((q: any) => ({
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
                        text: `Quiz saved successfully to GatrAI! 🎉\n\n📝 ${normalizedQuestions.length} questions saved.\n🔗 Try the quiz here: ${quizUrl}\n\nThe quiz is ready to be taken. Share the link with others to let them take the quiz too!`
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
