import { NextResponse } from "next/server";
import { isGroqConfigured, getGroqModel, getGroqApiKey } from "@/lib/server/groqClient";

export async function GET(req: Request) {
  // Read request to ensure dynamic evaluation
  const _url = req.url;
  const configured = isGroqConfigured();
  const model = getGroqModel();
  const rawKey = getGroqApiKey();
  const maskedKey = rawKey ? `${rawKey.slice(0, 7)}...${rawKey.slice(-4)}` : null;

  return NextResponse.json({
    provider: "Groq",
    configured,
    model,
    maskedKey,
    mode: configured ? "live" : "demo",
  });
}
