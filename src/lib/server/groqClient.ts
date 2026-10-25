import Groq from "groq-sdk";
import fs from "fs";
import path from "path";

function readEnvVar(key: string): string | undefined {
  if (process.env[key]) return process.env[key];
  try {
    const envPath = path.join(process.cwd(), ".env.local");
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf-8");
      for (const line of content.split("\n")) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith("#")) {
          const eqIdx = trimmed.indexOf("=");
          if (eqIdx !== -1) {
            const k = trimmed.slice(0, eqIdx).trim();
            const v = trimmed.slice(eqIdx + 1).trim();
            if (k === key) return v;
          }
        }
      }
    }
  } catch {
    // Ignore fs errors
  }
  return undefined;
}

export interface GroqCompletionOptions {
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>;
  temperature?: number;
  max_tokens?: number;
  response_format?: { type: "json_object" | "text" };
  customApiKey?: string;
  customModel?: string;
}

export interface GroqResult {
  success: boolean;
  content: string | null;
  error?: string;
  errorCode?: string;
  model: string;
}

export function getGroqModel(override?: string): string {
  // Always prioritize server-side environment variable GROQ_MODEL
  const envModel = process.env.GROQ_MODEL || readEnvVar("GROQ_MODEL");
  if (envModel && envModel.trim() && !envModel.includes("llama-3.1-8b-instant")) {
    return envModel.trim();
  }
  if (override && override.trim() && !override.includes("llama-3.1-8b-instant")) {
    return override.trim();
  }
  return "openai/gpt-oss-120b";
}

export function getGroqApiKey(override?: string): string | undefined {
  if (override && override.trim().length > 0) return override.trim();
  return readEnvVar("GROQ_API_KEY") || process.env.GROQ_API_KEY?.trim();
}

export function isGroqConfigured(override?: string): boolean {
  const key = getGroqApiKey(override);
  return Boolean(key && key.length > 5);
}

export async function executeGroqChat(options: GroqCompletionOptions): Promise<GroqResult> {
  const apiKey = getGroqApiKey(options.customApiKey);
  const model = getGroqModel(options.customModel);

  if (!apiKey) {
    return {
      success: false,
      content: null,
      error: "GROQ_API_KEY is not configured in server environment variables (.env.local).",
      errorCode: "MISSING_API_KEY",
      model,
    };
  }

  try {
    const groq = new Groq({ apiKey });

    const completion = await groq.chat.completions.create({
      model,
      messages: options.messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.max_tokens ?? 2500,
      response_format: options.response_format,
    });

    const text = completion.choices[0]?.message?.content || "";

    return {
      success: true,
      content: text,
      model,
    };
  } catch (error: any) {
    const status = error?.status || error?.statusCode;
    const errorBody = error?.error?.message || error?.body?.error?.message || error?.message || String(error);

    return {
      success: false,
      content: null,
      error: `Groq API Error (${status || "Unknown"}): ${errorBody}`,
      errorCode: status ? String(status) : "GROQ_ERROR",
      model,
    };
  }
}
