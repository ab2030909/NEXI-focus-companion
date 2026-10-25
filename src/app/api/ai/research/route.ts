import { NextResponse } from "next/server";
import { executeGroqChat } from "@/lib/server/groqClient";
import { isSearchProviderConfigured, executeLiveSearch } from "@/lib/server/searchProvider";

export async function POST(req: Request) {
  try {
    const customApiKey = req.headers.get("x-groq-api-key") || undefined;
    const customModel = req.headers.get("x-groq-model") || undefined;

    const body = await req.json();
    const { topic, objective, depth } = body;

    const { configured: hasLiveSearch, provider: searchProviderName } = isSearchProviderConfigured();

    let liveSourcesContext = "";
    let verifiedSources: Array<{ title: string; url: string; type: any; verified: boolean }> = [];

    if (hasLiveSearch) {
      const searchResults = await executeLiveSearch(`${topic} developer tools sentiment benchmarks`);
      if (searchResults.length > 0) {
        liveSourcesContext = "\nLive Verified Web Search Results:\n" +
          searchResults.map((r, i) => `[Source ${i + 1}]: ${r.title} (${r.url})\n${r.snippet}`).join("\n\n");
        verifiedSources = searchResults.map((r) => ({
          title: r.title,
          url: r.url,
          type: "Official Doc",
          verified: true,
        }));
      }
    }

    const systemPrompt = `You are a Principal Developer Ecosystem Researcher. Return a valid JSON object analyzing the developer ecosystem.
Do NOT invent fake URLs or fake citations. ${hasLiveSearch ? 'Ground your findings in the provided live web search results.' : 'Since live web search is not active, synthesize from model knowledge and do not invent fake URLs.'}
Strict JSON format:
{
  "topic": "${topic}",
  "objective": "${objective}",
  "depth": "${depth || 'Deep Ecosystem Analysis'}",
  "targetEcosystem": "Identified ecosystem platforms, frameworks, and runtimes",
  "findings": [
    {
      "theme": "Theme title",
      "summary": "Summary paragraph",
      "details": "Technical breakdown and real-world developer sentiment",
      "sources": ${hasLiveSearch && verifiedSources.length > 0 ? JSON.stringify(verifiedSources.slice(0, 2)) : '[]'}
    }
  ],
  "keyInsights": ["Insight 1", "Insight 2", "Insight 3"],
  "recommendedActions": ["Action 1", "Action 2", "Action 3"]
}`;

    const userPrompt = `Research topic: ${topic}\nObjective: ${objective}\nDepth: ${depth}\n${liveSourcesContext}`;

    const groqResponse = await executeGroqChat({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.5,
      customApiKey,
      customModel,
    });

    if (!groqResponse.success || !groqResponse.content) {
      return NextResponse.json(
        {
          success: false,
          error: groqResponse.error || "Groq research synthesis failed.",
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
      hasLiveSearch,
      searchProviderName,
      report: {
        ...parsed,
        id: `res-${Date.now()}`,
        isDemo: !hasLiveSearch,
        createdAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to generate research" },
      { status: 500 }
    );
  }
}
