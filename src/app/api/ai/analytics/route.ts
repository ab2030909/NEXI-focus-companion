import { NextResponse } from "next/server";
import { executeGroqChat } from "@/lib/server/groqClient";

export async function POST(req: Request) {
  try {
    const customApiKey = req.headers.get("x-groq-api-key") || undefined;
    const customModel = req.headers.get("x-groq-model") || undefined;

    const body = await req.json();
    const { timeRange, impressions, signups, eventsCount } = body;

    const systemPrompt = `You are a Chief Developer Officer / VP of Developer Relations.
Return a valid JSON object with 3 strategic data-driven recommendations for the developer relations sprint.
Strict JSON format:
{
  "recommendations": [
    {
      "category": "Conversion Opportunity",
      "headline": "Short punchy observation",
      "detail": "Actionable recommendation with concrete steps."
    },
    {
      "category": "Event Optimization",
      "headline": "Short punchy observation",
      "detail": "Actionable recommendation with concrete steps."
    },
    {
      "category": "Outreach Funnel",
      "headline": "Short punchy observation",
      "detail": "Actionable recommendation with concrete steps."
    }
  ]
}`;

    const userPrompt = `Telemetry data for ${timeRange || 'Last 30 Days'}:
- Total developer impressions: ${impressions || '76,400'}
- SDK installs/signups: ${signups || '2,240'}
- Events hosted: ${eventsCount || '4'}`;

    const groqResponse = await executeGroqChat({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.6,
      customApiKey,
      customModel,
    });

    if (!groqResponse.success || !groqResponse.content) {
      return NextResponse.json(
        {
          success: false,
          error: groqResponse.error || "Groq analytics recommendation failed.",
          model: groqResponse.model,
        },
        { status: 400 }
      );
    }

    const parsed = JSON.parse(groqResponse.content);
    return NextResponse.json({
      success: true,
      provider: "Groq",
      model: groqResponse.model,
      recommendations: parsed.recommendations,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to generate recommendations" },
      { status: 500 }
    );
  }
}
