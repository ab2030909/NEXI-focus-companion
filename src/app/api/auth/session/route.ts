import { NextResponse } from "next/server";
import { getUserBySessionToken } from "@/lib/server/auth";

export async function GET(req: Request) {
  const cookieHeader = req.headers.get("cookie") || "";
  const tokenMatch = cookieHeader.match(/devrelos_session=([^;]+)/);
  const authHeader = req.headers.get("authorization");
  const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  const token = tokenMatch ? tokenMatch[1] : bearerToken;

  if (!token) {
    return NextResponse.json({ authenticated: false, user: null });
  }

  const user = await getUserBySessionToken(token);
  if (!user) {
    const res = NextResponse.json({ authenticated: false, user: null });
    res.cookies.delete("devrelos_session");
    return res;
  }

  return NextResponse.json({ authenticated: true, user });
}
