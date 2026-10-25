import { NextResponse } from "next/server";
import { registerUser } from "@/lib/server/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, name } = body;

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }
    if (!password || password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
    }

    const { user, token } = await registerUser(email, password, name);

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
    return NextResponse.json({ error: error?.message || "Registration failed" }, { status: 400 });
  }
}
