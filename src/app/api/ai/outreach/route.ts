import { NextResponse } from "next/server";
import { executeGroqChat } from "@/lib/server/groqClient";

export async function POST(req: Request) {
  try {
    const customApiKey = req.headers.get("x-groq-api-key") || undefined;
    const customModel = req.headers.get("x-groq-model") || undefined;

    const body = await req.json();
    const { contact, customAngle } = body;

    const systemPrompt = `You are a warm, highly professional Head of Developer Relations.
Draft a high-converting, personalized developer outreach email.
Never sound like generic sales spam. Speak engineer-to-engineer with authentic appreciation for their technical contributions.`;

    const userPrompt = `Draft an email to:
Name: ${contact.name}
Role: ${contact.role}
Organization: ${contact.organization}
Category: ${contact.category}
Custom Angle / Goal: ${customAngle || "Collaboration & Speaker Invitation"}`;

    const groqResponse = await executeGroqChat({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 1500,
      customApiKey,
      customModel,
    });

    if (!groqResponse.success || !groqResponse.content) {
      return NextResponse.json(
        {
          success: false,
          error: groqResponse.error || "Groq outreach drafting failed.",
          model: groqResponse.model,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      provider: "Groq",
      model: groqResponse.model,
      draft: groqResponse.content,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to generate outreach" },
      { status: 500 }
    );
  }
}
