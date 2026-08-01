import { NextResponse } from "next/server";
import { AI_PROVIDER, AI_MODEL_NAME } from "@/config";

export async function GET() {
    // Default to openrouter/auto when AI_PROVIDER is not set or set to "auto"
    const provider = AI_PROVIDER === "auto" || !AI_PROVIDER ? "openrouter" : AI_PROVIDER;
    const modelName = AI_MODEL_NAME || (provider === "openrouter" ? "openrouter/auto" : "llama-3.3-70b-versatile");

    return NextResponse.json({ provider, modelName });
}
