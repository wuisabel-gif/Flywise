/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FLYWISE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface OpenAiHost {
  callTool?: (name: string, args: unknown) => Promise<{ structuredContent?: Record<string, unknown> }>;
  toolOutput?: Record<string, unknown>;
  theme?: "light" | "dark";
}

interface Window { openai?: OpenAiHost }
