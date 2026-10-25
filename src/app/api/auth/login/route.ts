import { NextResponse } from "next/server";
import { loginUser } from "@/lib/server/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }

    const { user, token } = await loginUser(email, password);

    const res = NextResponse.json({ success: true, user });
    res.cookies.set("devrelos_session", token, {
      httpOnly: true,
      secure: false, // Allows local development and testing on http://localhost
      path: "/",
      maxAge: 30 * 86400,
      sameSite: "lax",
    });

    return res;
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Invalid email or password." }, { status: 401 });
  }
}
