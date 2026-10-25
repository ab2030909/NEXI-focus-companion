import { NextResponse } from "next/server";
import { getDatabaseForWorkspace, saveDatabaseForWorkspace } from "@/lib/server/db";
import { getUserBySessionToken } from "@/lib/server/auth";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const cookieHeader = req.headers.get("cookie") || "";
  const tokenMatch = cookieHeader.match(/devrelos_session=([^;]+)/);
  const user = tokenMatch ? await getUserBySessionToken(tokenMatch[1]) : null;

  const headerWs = req.headers.get("x-workspace-id");
  const queryWs = url.searchParams.get("workspaceId");

  const effectiveWs = headerWs || queryWs || user?.activeWorkspaceId || "ws-vectorsearch";

  const data = getDatabaseForWorkspace(effectiveWs);
  return NextResponse.json({
    ...data,
    workspaceId: effectiveWs,
  });
}

export async function POST(req: Request) {
  try {
    const cookieHeader = req.headers.get("cookie") || "";
    const tokenMatch = cookieHeader.match(/devrelos_session=([^;]+)/);
    const user = tokenMatch ? await getUserBySessionToken(tokenMatch[1]) : null;

    const body = await req.json();
    const effectiveWs = body.workspaceId || req.headers.get("x-workspace-id") || user?.activeWorkspaceId || "ws-vectorsearch";
    const effectiveUserId = user?.id;

    const updated = saveDatabaseForWorkspace(effectiveWs, effectiveUserId, body);
    return NextResponse.json({ success: true, updated, workspaceId: effectiveWs });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to persist data" },
      { status: 500 }
    );
  }
}
