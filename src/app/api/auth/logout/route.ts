import { NextResponse } from "next/server";
import { logoutSessionToken } from "@/lib/server/auth";

export async function POST(req: Request) {
  const cookieHeader = req.headers.get("cookie") || "";
  const tokenMatch = cookieHeader.match(/devrelos_session=([^;]+)/);
  if (tokenMatch) {
    await logoutSessionToken(tokenMatch[1]);
  }

  const res = NextResponse.json({ success: true });
  res.cookies.delete("devrelos_session");
  return res;
}
