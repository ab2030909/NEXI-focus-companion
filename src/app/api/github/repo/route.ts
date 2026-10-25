import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    let repoInput: string = body.repo || "";

    if (!repoInput.trim()) {
      return NextResponse.json({ error: "Repository name is required (e.g. owner/repo)" }, { status: 400 });
    }

    // Clean URL if full GitHub URL provided
    repoInput = repoInput.replace(/https?:\/\/github\.com\//, "").replace(/\/$/, "").trim();

    const parts = repoInput.split("/");
    if (parts.length < 2) {
      return NextResponse.json(
        { error: "Invalid repository format. Please provide 'owner/repo' (e.g. vercel/next.js)" },
        { status: 400 }
      );
    }

    const owner = parts[0];
    const repo = parts[1];

    const token = process.env.GITHUB_TOKEN?.trim();
    const headers: Record<string, string> = {
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "DevRelOS-Agent",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    // Fetch repository metadata
    const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers,
      cache: "no-store",
    });

    if (!repoRes.ok) {
      if (repoRes.status === 404) {
        return NextResponse.json({ error: `Repository '${owner}/${repo}' not found on GitHub.` }, { status: 404 });
      }
      if (repoRes.status === 403) {
        return NextResponse.json(
          { error: "GitHub API rate limit exceeded. Configure GITHUB_TOKEN in .env.local to increase limits." },
          { status: 429 }
        );
      }
      return NextResponse.json({ error: `GitHub API error: ${repoRes.statusText}` }, { status: repoRes.status });
    }

    const repoData = await repoRes.json();

    // Fetch latest release
    let latestRelease = null;
    try {
      const releaseRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/releases/latest`, {
        headers,
        cache: "no-store",
      });
      if (releaseRes.ok) {
        const releaseData = await releaseRes.json();
        latestRelease = {
          tagName: releaseData.tag_name,
          name: releaseData.name,
          publishedAt: releaseData.published_at,
          htmlUrl: releaseData.html_url,
        };
      }
    } catch {
      // Ignore release errors
    }

    return NextResponse.json({
      success: true,
      repository: {
        fullName: repoData.full_name,
        name: repoData.name,
        owner: repoData.owner?.login,
        description: repoData.description,
        stars: repoData.stargazers_count,
        forks: repoData.forks_count,
        openIssues: repoData.open_issues_count,
        watchers: repoData.subscribers_count || repoData.watchers_count,
        language: repoData.language,
        topics: repoData.topics || [],
        license: repoData.license?.spdx_id || repoData.license?.name || "Open Source",
        lastPushedAt: repoData.pushed_at,
        htmlUrl: repoData.html_url,
        latestRelease,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to analyze GitHub repository" },
      { status: 500 }
    );
  }
}
