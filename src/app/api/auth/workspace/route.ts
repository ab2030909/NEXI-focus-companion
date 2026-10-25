import { NextResponse } from "next/server";
import {
  getUserBySessionToken,
  createNewWorkspace,
  switchActiveWorkspace,
} from "@/lib/server/auth";

export async function POST(req: Request) {
  try {
    const cookieHeader = req.headers.get("cookie") || "";
    const tokenMatch = cookieHeader.match(/devrelos_session=([^;]+)/);
    if (!tokenMatch) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await getUserBySessionToken(tokenMatch[1]);
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { action, workspaceId, workspaceData } = body;

    if (action === "switch" && workspaceId) {
      const updatedUser = await switchActiveWorkspace(currentUser.id, workspaceId);
      return NextResponse.json({ success: true, user: updatedUser });
    }

    if (action === "create" && workspaceData) {
      const updatedUser = await createNewWorkspace(currentUser.id, workspaceData);
      return NextResponse.json({ success: true, user: updatedUser });
    }

    return NextResponse.json({ error: "Invalid workspace action" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Workspace action failed" }, { status: 400 });
  }
}
