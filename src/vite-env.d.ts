/// <reference types="vite/client" />

interface OpenAiHost {
  callTool?: (name: string, args: unknown) => Promise<{ structuredContent?: Record<string, unknown> }>;
  toolOutput?: Record<string, unknown>;
  theme?: "light" | "dark";
}

interface Window { openai?: OpenAiHost }
