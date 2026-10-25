import { NextResponse } from "next/server";
import { executeGroqChat } from "@/lib/server/groqClient";

export async function POST(req: Request) {
  try {
    const customApiKey = req.headers.get("x-groq-api-key") || undefined;
    const customModel = req.headers.get("x-groq-model") || undefined;

    const body = await req.json();
    const { name, toolOrProject, targetAudience, objective, duration, channels, budget } = body;

    const systemPrompt = `You are a senior Developer Relations (DevRel) architect. Return a strict, valid JSON object for an end-to-end technical developer campaign.
Do NOT output markdown backticks or commentary outside the JSON.
The JSON must adhere to this exact structure:
{
  "name": "${name || toolOrProject + ' Campaign'}",
  "toolOrProject": "${toolOrProject}",
  "targetAudience": "${targetAudience}",
  "objective": "${objective}",
  "duration": "${duration || '4 Weeks'}",
  "channels": ${JSON.stringify(channels || ["X (Twitter)", "Hacker News", "Dev.to", "GitHub"])},
  "budget": "${budget || '$5,000'}",
  "status": "Active",
  "strategy": {
    "summary": "Detailed technical strategy summary...",
    "narrativePillars": ["Pillar 1", "Pillar 2", "Pillar 3"],
    "valueProposition": "Core value proposition...",
    "differentiators": ["Diff 1", "Diff 2", "Diff 3"]
  },
  "audienceProfile": {
    "personas": ["Persona 1", "Persona 2"],
    "painPoints": ["Pain 1", "Pain 2", "Pain 3"],
    "wateringHoles": ["Hole 1", "Hole 2"],
    "preferredFormats": ["Format 1", "Format 2"]
  },
  "keyMessaging": {
    "primaryHeadline": "Headline",
    "elevatorPitch": "Pitch",
    "proofPoints": ["Point 1", "Point 2"]
  },
  "contentCalendar": [
    { "id": "cc-1", "day": "Day 1", "date": "2026-11-01", "channel": "X (Twitter)", "type": "Announcement Thread", "title": "Launch Thread", "status": "Scheduled" },
    { "id": "cc-2", "day": "Day 3", "date": "2026-11-03", "channel": "Hacker News", "type": "Show HN", "title": "Show HN Post", "status": "Drafted" },
    { "id": "cc-3", "day": "Day 7", "date": "2026-11-07", "channel": "Dev.to", "type": "Technical Tutorial", "title": "Tutorial Title", "status": "Drafted" }
  ],
  "tutorials": [
    { "title": "Tutorial Title 1", "targetAudience": "${targetAudience}", "estimatedReadTime": "8 min read", "summary": "Walkthrough...", "keyTakeaway": "Takeaway..." }
  ],
  "socialDrafts": [
    { "platform": "X / Twitter", "hook": "Engaging hook...", "content": "Full post text...", "suggestedAssets": "Terminal recording..." },
    { "platform": "LinkedIn", "hook": "Engaging hook...", "content": "Full post text..." }
  ],
  "eventSuggestions": [
    { "title": "Hands-on Workshop", "format": "Virtual Workshop", "description": "Workshop description...", "targetAttendees": 300 }
  ],
  "outreachDrafts": [
    { "recipientType": "Key Ecosystem Maintainers", "subject": "Collaboration pitch...", "body": "Email body..." }
  ],
  "kpis": [
    { "name": "GitHub Stars", "target": "2,000", "current": "0", "unit": "stars", "progressPercent": 0 },
    { "name": "Active API Keys", "target": "1,000", "current": "0", "unit": "keys", "progressPercent": 0 }
  ],
  "tasks": [
    { "id": "t-1", "title": "Prepare quickstart sample repository", "category": "Content", "dueDate": "2026-11-02", "completed": false, "assignedTo": "DevRel Advocate" }
  ]
}`;

    const userPrompt = `Create a developer relations campaign for:
- Tool/Technology: ${toolOrProject}
- Target Audience: ${targetAudience}
- Objective: ${objective}
- Channels: ${channels?.join(", ")}
- Duration: ${duration}
- Budget: ${budget}`;

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
          error: groqResponse.error || "Groq campaign generation failed.",
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
      campaign: parsed,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to generate campaign" },
      { status: 500 }
    );
  }
}
