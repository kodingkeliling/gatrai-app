import { NextRequest, NextResponse } from "next/server";
import { Question, SkillType } from "@/store/use-exam-store";
import { SYSTEM_PROMPT } from "@/utils/ai-prompts";
import { FINE_TUNE_EXAMPLES } from "@/utils/ai-examples";
import {
    GEMINI_API_KEY as DEFAULT_GEMINI_API_KEY,
    GROQ_API_KEY as DEFAULT_GROQ_API_KEY,
    OPENAI_API_KEY as DEFAULT_OPENAI_API_KEY,
    ANTHROPIC_API_KEY as DEFAULT_ANTHROPIC_API_KEY,
    OPENROUTER_API_KEY as DEFAULT_OPENROUTER_API_KEY
} from "@/config";

async function callGemini(prompt: string, model: string, customKey?: string): Promise<string> {
    const apiKey = customKey || DEFAULT_GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY is not set");

    // Map legacy or shorthand IDs to correct ones
    let modelId = model.startsWith("models/") ? model.split("/")[1] : model;

    const contents = [
        ...FINE_TUNE_EXAMPLES.map(ex => ({
            role: ex.role === "assistant" ? "model" : "user",
            parts: [{ text: ex.content }]
        })),
        { role: "user", parts: [{ text: prompt }] }
    ];

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent`;

    const res = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": apiKey
        },
        body: JSON.stringify({
            system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
            contents,
            generationConfig: {
                temperature: 1,
                topP: 0.95,
                topK: 40,
                maxOutputTokens: 8192,
            }
        }),
    });

    const data = await res.json();
    if (!res.ok) {
        console.error("Gemini Error Detail:", JSON.stringify(data, null, 2));
        throw new Error(data.error?.message || `Gemini API error (${res.status})`);
    }

    return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

async function callGroq(prompt: string, model: string, customKey?: string): Promise<string> {
    const apiKey = customKey || DEFAULT_GROQ_API_KEY;
    if (!apiKey) throw new Error("GROQ_API_KEY is not set");

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model,
            messages: [
                { role: "system", content: SYSTEM_PROMPT },
                ...FINE_TUNE_EXAMPLES,
                { role: "user", content: prompt },
            ],
            temperature: 1.1,
        }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || "Groq API error");
    return data.choices?.[0]?.message?.content || "";
}

async function callOpenAI(prompt: string, model: string, customKey?: string): Promise<string> {
    const apiKey = customKey || DEFAULT_OPENAI_API_KEY;
    if (!apiKey) throw new Error("OPENAI_API_KEY is not set");

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model,
            messages: [
                { role: "system", content: SYSTEM_PROMPT },
                ...FINE_TUNE_EXAMPLES,
                { role: "user", content: prompt },
            ],
        }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || "OpenAI API error");
    return data.choices?.[0]?.message?.content || "";
}

async function callAnthropic(prompt: string, model: string, customKey?: string): Promise<string> {
    const apiKey = customKey || DEFAULT_ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");

    const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
            model,
            max_tokens: 1024,
            system: SYSTEM_PROMPT,
            messages: [
                ...FINE_TUNE_EXAMPLES,
                { role: "user", content: prompt }
            ],
        }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || "Anthropic API error");
    return data.content?.[0]?.text || "";
}

async function callOpenRouter(prompt: string, model: string, customKey?: string): Promise<string> {
    const apiKey = customKey || DEFAULT_OPENROUTER_API_KEY;
    if (!apiKey) throw new Error("OPENROUTER_API_KEY is not set");

    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
            "HTTP-Referer": "https://gatrai.id",
            "X-Title": "GatrAI Exam Generator",
        },
        body: JSON.stringify({
            model: model || "openrouter/auto",
            messages: [
                { role: "system", content: SYSTEM_PROMPT },
                ...FINE_TUNE_EXAMPLES,
                { role: "user", content: prompt },
            ],
        }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || "OpenRouter API error");
    return data.choices?.[0]?.message?.content || "";
}

function parseCSV(raw: string, defaultSkill: SkillType): Question[] {
    console.log("[groq] Raw response:", raw);
    const cleanRaw = raw.replace(/```[a-z]*\n?/gi, "").replace(/```/g, "").trim();
    let rows = cleanRaw.split("<_>").filter((r) => r.trim().length > 0);
    if (rows.length === 0 && cleanRaw.includes("|->")) {
        rows = [cleanRaw];
    }

    const questions: Question[] = [];
    rows.forEach((row) => {
        if (!row.includes("|->")) return;
        const parts = row.split("|->").map((p) => p.trim()).filter(p => p !== "");

        let description = parts[0] || "No description provided by AI.";

        // Clean up common AI hallucinations/instructions
        description = description.replace(/MUST_be_written_in_this_format_is_replaced_by_this_line:?/gi, "").trim();
        if (description.includes(":")) {
            // If it starts with some prefix like "Reading: ", clean it
            const colonIndex = description.indexOf(":");
            if (colonIndex < 20 && !description.includes("<")) { // Only if it looks like a short prefix
                description = description.slice(colonIndex + 1).trim();
            }
        }

        let optionsStr = "null";
        let answer = "No sample answer provided.";
        let skill = defaultSkill;

        if (parts.length >= 4) {
            optionsStr = parts[1];
            answer = parts[2];
            skill = (parts[3] || defaultSkill) as SkillType;
        } else if (parts.length >= 2) {
            answer = parts[1];
            if (parts.length >= 3) skill = parts[2] as SkillType;
        }

        let options: string[] | null = null;
        if (optionsStr && optionsStr.toLowerCase() !== "null" && optionsStr !== "[]") {
            try {
                options = JSON.parse(optionsStr.replace(/'/g, '"'));
            } catch {
                const matches = optionsStr.match(/'([^']+)'/g);
                options = matches ? matches.map((m) => m.slice(1, -1)) : optionsStr.replace(/[\[\]']/g, "").split(",").map((o) => o.trim()).filter(Boolean);
            }
        }

        questions.push({ id: crypto.randomUUID(), description, options: options && options.length > 0 ? options : null, answer, skill });
    });
    return questions;
}

export async function POST(req: NextRequest) {
    try {
        const { range, skill, language, provider, model, customApiKey } = await req.json();

        if (!range || !skill) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Use defaults if not provided (fallback)
        const activeProvider = provider || "groq";
        const activeModel = model || "llama-3.3-70b-versatile";

        const userPrompt = `Generate exactly ${range} questions for the ['${skill}'] skill${language ? ` in ${language} language` : ""}. Ensure you follow the CSV format specified in the system prompt.`;
        let rawResponse = "";

        switch (activeProvider) {
            case "gemini": rawResponse = await callGemini(userPrompt, activeModel, customApiKey); break;
            case "groq": rawResponse = await callGroq(userPrompt, activeModel, customApiKey); break;
            case "openai": rawResponse = await callOpenAI(userPrompt, activeModel, customApiKey); break;
            case "anthropic": rawResponse = await callAnthropic(userPrompt, activeModel, customApiKey); break;
            case "openrouter": rawResponse = await callOpenRouter(userPrompt, activeModel, customApiKey); break;
            default: rawResponse = await callOpenRouter(userPrompt, "openrouter/auto", customApiKey); break;
        }

        console.log(`[${activeProvider}] Raw response:`, rawResponse);
        const questions = parseCSV(rawResponse, skill as SkillType);
        return NextResponse.json({ questions, raw: rawResponse });
    } catch (error: any) {
        console.error("API Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
