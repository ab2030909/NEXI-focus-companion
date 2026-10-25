import { NextResponse } from "next/server";
import { executeGroqChat } from "@/lib/server/groqClient";

export async function POST(req: Request) {
  try {
    const customApiKey = req.headers.get("x-groq-api-key") || undefined;
    const customModel = req.headers.get("x-groq-model") || undefined;

    const body = await req.json();
    const { type, topic, audience, tone, length, codeLanguage } = body;

    const systemPrompt = `You are an elite developer advocate, staff software engineer, and technical author.
Write high-quality, production-grade technical content for developers.
Format with clean Markdown, practical code examples, and zero marketing fluff.
Tone: ${tone || "Authoritative, Code-First, Architectural"}
Target Audience: ${audience || "Senior Developers"}
Primary Language/SDK: ${codeLanguage || "TypeScript"}
Content Length: ${length || "Comprehensive"}`;

    const userPrompt = `Generate a ${type} on the following subject:
Topic: ${topic}
Make it deeply practical, accurate, and ready for publication.`;

    const groqResponse = await executeGroqChat({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 2500,
      customApiKey,
      customModel,
    });

    if (!groqResponse.success || !groqResponse.content) {
      return NextResponse.json(
        {
          success: false,
          error: groqResponse.error || "Groq content generation failed.",
          model: groqResponse.model,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      provider: "Groq",
      model: groqResponse.model,
      content: groqResponse.content,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to generate content" },
      { status: 500 }
    );
  }
}
