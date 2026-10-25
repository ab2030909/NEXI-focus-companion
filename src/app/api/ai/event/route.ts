import { NextResponse } from "next/server";
import { executeGroqChat } from "@/lib/server/groqClient";

export async function POST(req: Request) {
  try {
    const customApiKey = req.headers.get("x-groq-api-key") || undefined;
    const customModel = req.headers.get("x-groq-model") || undefined;

    const body = await req.json();
    const { eventTitle, eventType, attendeeCount, notes } = body;

    const systemPrompt = `You are a Developer Relations leader. Write an engaging post-event recap summary and actionable takeaways. Use crisp Markdown formatting.`;

    const userPrompt = `Synthesize an event recap for:
Title: ${eventTitle}
Type: ${eventType}
Attendees: ${attendeeCount}
Notes: ${notes || "Successful developer meetup with interactive live coding and community Q&A."}`;

    const groqResponse = await executeGroqChat({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.6,
      max_tokens: 1500,
      customApiKey,
      customModel,
    });

    if (!groqResponse.success || !groqResponse.content) {
      return NextResponse.json(
        {
          success: false,
          error: groqResponse.error || "Groq event recap generation failed.",
          model: groqResponse.model,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      provider: "Groq",
      model: groqResponse.model,
      recap: groqResponse.content,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to generate event recap" },
      { status: 500 }
    );
  }
}
