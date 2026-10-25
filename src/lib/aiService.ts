import {
  Campaign,
  ResearchReport,
  ContentDraft,
  ContentFormat,
  OutreachContact,
} from "@/types";

export interface GenerateCampaignParams {
  name: string;
  toolOrProject: string;
  targetAudience: string;
  objective: string;
  duration: string;
  channels: string[];
  budget?: string;
  onAlert?: (msg: string, type?: "info" | "error" | "success") => void;
}

export interface GenerateResearchParams {
  topic: string;
  objective: string;
  depth: "Quick Brief" | "Deep Ecosystem Analysis" | "Competitive Landscape" | "Technical Benchmark";
  onAlert?: (msg: string, type?: "info" | "error" | "success") => void;
}

export interface GenerateContentParams {
  type: ContentFormat;
  topic: string;
  audience: string;
  tone: string;
  length: "Short" | "Medium" | "Comprehensive";
  codeLanguage?: string;
  onAlert?: (msg: string, type?: "info" | "error" | "success") => void;
}

function getClientAIHeaders(): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (typeof window !== "undefined") {
    const customKey = localStorage.getItem("devrelos_groq_key");
    const customModel = localStorage.getItem("devrelos_groq_model");
    if (customKey) headers["x-groq-api-key"] = customKey;
    if (customModel && !customModel.includes("llama-3.1-8b-instant")) {
      headers["x-groq-model"] = customModel;
    } else {
      localStorage.removeItem("devrelos_groq_model");
    }
  }
  return headers;
}

export async function fetchAIStatus(): Promise<{
  provider: string;
  configured: boolean;
  model: string;
  maskedKey: string | null;
  mode: string;
}> {
  try {
    const res = await fetch("/api/ai/status", {
      headers: getClientAIHeaders(),
    });
    if (res.ok) return await res.json();
  } catch {
    // Ignore
  }
  return {
    provider: "Groq",
    configured: false,
    model: "openai/gpt-oss-120b",
    maskedKey: null,
    mode: "demo",
  };
}

export async function generateAICampaign(params: GenerateCampaignParams): Promise<Partial<Campaign>> {
  const res = await fetch("/api/ai/campaign", {
    method: "POST",
    headers: getClientAIHeaders(),
    body: JSON.stringify(params),
  });

  const data = await res.json();
  if (!res.ok || !data.success || !data.campaign) {
    const errorMsg = data.error || `Campaign generation failed (HTTP ${res.status})`;
    params.onAlert?.(errorMsg, "error");
    throw new Error(errorMsg);
  }

  params.onAlert?.(`Campaign generated with Groq (${data.model})`, "success");
  return data.campaign;
}

export async function generateAIResearch(params: GenerateResearchParams): Promise<ResearchReport> {
  const res = await fetch("/api/ai/research", {
    method: "POST",
    headers: getClientAIHeaders(),
    body: JSON.stringify(params),
  });

  const data = await res.json();
  if (!res.ok || !data.success || !data.report) {
    const errorMsg = data.error || `Research synthesis failed (HTTP ${res.status})`;
    params.onAlert?.(errorMsg, "error");
    throw new Error(errorMsg);
  }

  params.onAlert?.(`Ecosystem synthesized with Groq (${data.model})`, "success");
  return data.report;
}

export async function generateAIContent(params: GenerateContentParams): Promise<string> {
  const res = await fetch("/api/ai/content", {
    method: "POST",
    headers: getClientAIHeaders(),
    body: JSON.stringify(params),
  });

  const data = await res.json();
  if (!res.ok || !data.success || !data.content) {
    const errorMsg = data.error || `Content generation failed (HTTP ${res.status})`;
    params.onAlert?.(errorMsg, "error");
    throw new Error(errorMsg);
  }

  params.onAlert?.(`Content drafted with Groq (${data.model})`, "success");
  return data.content;
}

export async function generateAIEmailDraft(
  contact: OutreachContact,
  customAngle?: string,
  onAlert?: (msg: string, type?: "info" | "error" | "success") => void
): Promise<string> {
  const res = await fetch("/api/ai/outreach", {
    method: "POST",
    headers: getClientAIHeaders(),
    body: JSON.stringify({ contact, customAngle }),
  });

  const data = await res.json();
  if (!res.ok || !data.success || !data.draft) {
    const errorMsg = data.error || `Email draft failed (HTTP ${res.status})`;
    onAlert?.(errorMsg, "error");
    throw new Error(errorMsg);
  }

  onAlert?.(`Personalized outreach drafted with Groq (${data.model})`, "success");
  return data.draft;
}
