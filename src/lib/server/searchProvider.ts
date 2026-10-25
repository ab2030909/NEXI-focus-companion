export interface LiveSearchResult {
  title: string;
  url: string;
  snippet: string;
  source: string;
}

export function isSearchProviderConfigured(): { configured: boolean; provider: string | null } {
  if (process.env.TAVILY_API_KEY) return { configured: true, provider: "Tavily" };
  if (process.env.SERPER_API_KEY) return { configured: true, provider: "Serper" };
  if (process.env.SERPAPI_API_KEY) return { configured: true, provider: "SerpApi" };
  return { configured: false, provider: null };
}

export async function executeLiveSearch(query: string): Promise<LiveSearchResult[]> {
  // 1. Tavily Search
  if (process.env.TAVILY_API_KEY) {
    try {
      const res = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: process.env.TAVILY_API_KEY,
          query,
          search_depth: "basic",
          max_results: 5,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        return (data.results || []).map((r: any) => ({
          title: r.title,
          url: r.url,
          snippet: r.content || "",
          source: "Tavily Verified Web Search",
        }));
      }
    } catch {
      // Fall through
    }
  }

  // 2. Serper Search
  if (process.env.SERPER_API_KEY) {
    try {
      const res = await fetch("https://google.serper.dev/search", {
        method: "POST",
        headers: {
          "X-API-KEY": process.env.SERPER_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ q: query, num: 5 }),
      });
      if (res.ok) {
        const data = await res.json();
        return (data.organic || []).map((r: any) => ({
          title: r.title,
          url: r.link,
          snippet: r.snippet || "",
          source: "Google / Serper Search",
        }));
      }
    } catch {
      // Fall through
    }
  }

  return [];
}
