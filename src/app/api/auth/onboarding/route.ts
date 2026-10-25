import { NextResponse } from "next/server";
import { getUserBySessionToken, completeOnboarding } from "@/lib/server/auth";

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
    const updatedUser = await completeOnboarding(currentUser.id, body);

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to complete onboarding" }, { status: 400 });
  }
}
