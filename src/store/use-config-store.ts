import { create } from "zustand";
import { persist } from "zustand/middleware";
import { AI_PROVIDER, AI_MODEL_NAME } from "@/config";
import { checkAIProviderStatus, ProviderStatus } from "@/actions/ai-status";

export type AIProvider = "gemini" | "groq" | "openai" | "anthropic" | "openrouter" | "custom";

interface AIModel {
    id: string;
    name: string;
    provider: AIProvider;
}

interface ConfigState {
    provider: AIProvider;
    modelName: string;
    customApiKeys: Record<AIProvider, string | null>;
    usePersonalKey: boolean;

    // Real connection status from server
    connectionStatuses: Record<AIProvider, ProviderStatus>;
    isManualSelection: boolean;

    // Actions
    setProvider: (provider: AIProvider) => void;
    setModelName: (modelName: string) => void;
    setCustomApiKey: (provider: AIProvider, key: string | null) => void;
    disconnectCustomKey: (provider: AIProvider) => void;
    setUsePersonalKey: (use: boolean) => void;
    updateStatus: (provider: AIProvider) => Promise<void>;
    useTokens: (amount: number) => void;
    syncRuntimeConfig: () => Promise<void>;
}

export const useConfigStore = create<ConfigState>()(
    persist(
        (set, get) => ({
            provider: (AI_PROVIDER as AIProvider) || "openrouter",
            modelName: AI_MODEL_NAME || "openrouter/auto",
            customApiKeys: {
                gemini: null,
                groq: null,
                openai: null,
                anthropic: null,
                openrouter: null,
                custom: null,
            },
            usePersonalKey: false,
            connectionStatuses: {
                gemini: "disconnected",
                groq: "disconnected",
                openai: "disconnected",
                anthropic: "disconnected",
                openrouter: "disconnected",
                custom: "disconnected",
            },
            isManualSelection: false,

            setProvider: (provider) => {
                set({
                    provider,
                    isManualSelection: true
                });
                get().updateStatus(provider);
            },
            setModelName: (modelName) => set({ modelName }),
            setCustomApiKey: (p, key) => {
                set((state) => ({
                    customApiKeys: {
                        ...state.customApiKeys,
                        [p]: key
                    },
                    // If we set a key for the current provider, enable personal key mode
                    usePersonalKey: p === get().provider ? !!key : state.usePersonalKey
                }));
                get().updateStatus(p);
            },
            disconnectCustomKey: (p) => {
                set((state) => ({
                    customApiKeys: {
                        ...state.customApiKeys,
                        [p]: null
                    },
                    usePersonalKey: p === get().provider ? false : state.usePersonalKey
                }));
                get().updateStatus(p);
            },
            setUsePersonalKey: (usePersonalKey) => set({ usePersonalKey }),

            updateStatus: async (p) => {
                const state = get();
                const customKey = state.customApiKeys[p];
                const status = await checkAIProviderStatus(p, customKey);
                set((state) => ({
                    connectionStatuses: {
                        ...state.connectionStatuses,
                        [p]: status
                    }
                }));
            },

            useTokens: () => { },

            syncRuntimeConfig: async () => {
                const state = get();

                // ONLY sync if the user hasn't made a manual choice yet
                if (state.isManualSelection) return;

                try {
                    const res = await fetch("/api/config");
                    if (res.ok) {
                        const data = await res.json();
                        set({
                            provider: data.provider,
                            modelName: data.modelName
                        });
                        // Check connection status for the synced provider
                        get().updateStatus(data.provider);
                    }
                } catch (err) {
                    console.error("Failed to sync runtime config:", err);
                }
            }
        }),
        {
            name: "fraise-config-storage",
        }
    )
);

export const DEFAULT_MODELS: Record<AIProvider, AIModel[]> = {
    groq: [
        { id: "llama-3.3-70b-versatile", name: "Llama 3.3 70B", provider: "groq" },
        { id: "llama-3.1-8b-instant", name: "Llama 3.1 8B", provider: "groq" },
        { id: "openai/gpt-oss-120b", name: "GPT OSS 120B", provider: "groq" },
        { id: "openai/gpt-oss-20b", name: "GPT OSS 20B", provider: "groq" },
        { id: "groq/compound", name: "Groq Compound", provider: "groq" },
        { id: "groq/compound-mini", name: "Groq Compound Mini", provider: "groq" },
        { id: "meta-llama/llama-4-scout-17b-16e-instruct", name: "Llama 4 Scout 17B", provider: "groq" },
        { id: "qwen/qwen3-32b", name: "Qwen 3 32B", provider: "groq" },
    ],
    gemini: [
        { id: "gemini-3-flash-preview", name: "Gemini 3 Flash (Preview)", provider: "gemini" },
    ],
    openai: [
        { id: "gpt-4o-mini", name: "GPT-4o Mini", provider: "openai" },
        { id: "gpt-4o", name: "GPT-4o", provider: "openai" },
    ],
    anthropic: [
        { id: "claude-3-5-sonnet-latest", name: "Claude 3.5 Sonnet", provider: "anthropic" },
    ],
    openrouter: [
        { id: "openrouter/auto", name: "Auto (Best Available)", provider: "openrouter" },
        { id: "meta-llama/llama-3.3-70b-instruct", name: "Llama 3.3 70B", provider: "openrouter" },
        { id: "google/gemini-2.0-flash-exp:free", name: "Gemini 2.0 Flash (Free)", provider: "openrouter" },
        { id: "mistralai/mixtral-8x7b-instruct", name: "Mixtral 8x7B", provider: "openrouter" },
    ],
    custom: []
};
