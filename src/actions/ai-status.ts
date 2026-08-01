"use server";

import { 
    GEMINI_API_KEY, 
    GROQ_API_KEY, 
    OPENAI_API_KEY, 
    ANTHROPIC_API_KEY,
    OPENROUTER_API_KEY
} from "@/config";

export type ProviderStatus = "connected" | "no-quota" | "disconnected";

export async function checkAIProviderStatus(provider: string, customKey?: string | null): Promise<ProviderStatus> {
    const key = customKey || (
        provider === "gemini" ? GEMINI_API_KEY :
        provider === "groq" ? GROQ_API_KEY :
        provider === "openai" ? OPENAI_API_KEY :
        provider === "anthropic" ? ANTHROPIC_API_KEY :
        provider === "openrouter" ? OPENROUTER_API_KEY : null
    );

    if (!key || key === `${provider.toUpperCase()}_API_KEY`) {
        return "disconnected";
    }

    try {
        // Simple validation based on provider
        if (provider === "groq") {
            const res = await fetch("https://api.groq.com/openai/v1/models", {
                headers: { "Authorization": `Bearer ${key}` }
            });
            return res.ok ? "connected" : "no-quota";
        }

        if (provider === "gemini") {
            const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
            return res.ok ? "connected" : "no-quota";
        }

        if (provider === "openai") {
            const res = await fetch("https://api.openai.com/v1/models", {
                headers: { "Authorization": `Bearer ${key}` }
            });
            return res.ok ? "connected" : "no-quota";
        }

        if (provider === "anthropic") {
            const res = await fetch("https://api.anthropic.com/v1/models", {
                headers: { 
                    "x-api-key": key,
                    "anthropic-version": "2023-06-01"
                }
            });
            return res.ok ? "connected" : "no-quota";
        }

        if (provider === "openrouter") {
            const res = await fetch("https://openrouter.ai/api/v1/models", {
                headers: { "Authorization": `Bearer ${key}` }
            });
            return res.ok ? "connected" : "no-quota";
        }

        return "disconnected";
    } catch (error) {
        console.error(`Error checking ${provider} status:`, error);
        return "disconnected";
    }
}
