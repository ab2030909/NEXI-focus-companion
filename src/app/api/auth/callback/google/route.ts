import { NextResponse } from "next/server";
import { exchangeCodeForGoogleUser } from "@/lib/server/googleAuth";
import { findOrCreateGoogleUser } from "@/lib/server/auth";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const errorParam = url.searchParams.get("error");

  const loginUrl = new URL("/login", req.url);

  if (errorParam) {
    loginUrl.searchParams.set("error", `Google authentication cancelled or denied: ${errorParam}`);
    return NextResponse.redirect(loginUrl);
  }

  if (!code) {
    loginUrl.searchParams.set("error", "No authorization code was provided by Google.");
    return NextResponse.redirect(loginUrl);
  }

  // Verify CSRF state against cookie
  const cookieHeader = req.headers.get("cookie") || "";
  const stateMatch = cookieHeader.match(/google_oauth_state=([^;]+)/);
  const storedState = stateMatch ? decodeURIComponent(stateMatch[1]) : null;

  if (!state || !storedState || state !== storedState) {
    loginUrl.searchParams.set("error", "Invalid OAuth state parameter. Please try signing in again.");
    return NextResponse.redirect(loginUrl);
  }

  try {
    // 1. Exchange authorization code with Google OAuth token endpoint
    const googleUser = await exchangeCodeForGoogleUser(code);

    // 2. Look up or provision verified user account & clean personal workspace
    const { token, isNewUser } = await findOrCreateGoogleUser({
      googleId: googleUser.sub,
      email: googleUser.email,
      name: googleUser.name || googleUser.email.split("@")[0],
      picture: googleUser.picture,
    });

    // 3. Set session cookie and redirect into app
    const targetUrl = new URL("/app", req.url);
    if (isNewUser) {
      targetUrl.searchParams.set("welcome", "true");
    }

    const res = NextResponse.redirect(targetUrl);
    res.cookies.set("devrelos_session", token, {
      httpOnly: true,
      secure: false, // allows localhost HTTP
      path: "/",
      maxAge: 30 * 86400,
      sameSite: "lax",
    });

    // Clean up temporary OAuth state cookie
    res.cookies.delete("google_oauth_state");

    return res;
  } catch (err: any) {
    loginUrl.searchParams.set("error", err?.message || "Failed to verify Google identity.");
    return NextResponse.redirect(loginUrl);
  }
}
