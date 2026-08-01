// App-level config
export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "GatrAI";
export const APP_LOGO = "/logo.png";

// Server-side only (used in API routes)
// Priority: Non-public (server-side runtime) > Public (client-side build-time)
export const AI_PROVIDER = process.env.AI_PROVIDER || process.env.NEXT_PUBLIC_AI_PROVIDER;
export const AI_MODEL_NAME = process.env.AI_MODEL_NAME || process.env.NEXT_PUBLIC_AI_MODEL_NAME;

// API Keys (Server Only)
export const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
export const GROQ_API_KEY = process.env.GROQ_API_KEY;
export const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
export const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
export const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

// Optional Dify
export const DIFY_HOST = process.env.NEXT_PUBLIC_DIFY_HOST;
export const DIFY_TOKEN = process.env.NEXT_PUBLIC_DIFY_EXAMS_QUESTIONS_GENERATOR_TOKEN;
