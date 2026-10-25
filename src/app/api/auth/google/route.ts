import { NextResponse } from "next/server";
import {
  isGoogleOAuthConfigured,
  generateOAuthState,
  buildGoogleAuthUrl,
  getGoogleRedirectUri,
  getGoogleClientId,
} from "@/lib/server/googleAuth";

export async function GET(req: Request) {
  const isConfigured = isGoogleOAuthConfigured();

  if (!isConfigured) {
    const errorUrl = new URL("/login", req.url);
    errorUrl.searchParams.set(
      "error",
      "Google OAuth is not configured yet on this server. Please add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to .env.local."
    );
    errorUrl.searchParams.set("setupRequired", "true");
    return NextResponse.redirect(errorUrl);
  }

  try {
    const state = generateOAuthState();
    const authUrl = buildGoogleAuthUrl(state);

    const res = NextResponse.redirect(authUrl);
    res.cookies.set("google_oauth_state", state, {
      httpOnly: true,
      secure: false, // compatible with localhost
      path: "/",
      maxAge: 600, // 10 minutes
      sameSite: "lax",
    });

    return res;
  } catch (error: any) {
    const errorUrl = new URL("/login", req.url);
    errorUrl.searchParams.set("error", error?.message || "Failed to start Google OAuth flow.");
    return NextResponse.redirect(errorUrl);
  }
}

export async function POST(req: Request) {
  const isConfigured = isGoogleOAuthConfigured();
  const clientId = getGoogleClientId();
  const redirectUri = getGoogleRedirectUri();

  if (!isConfigured) {
    return NextResponse.json({
      configured: false,
      error: "Google OAuth credentials are not configured in environment variables.",
      instructions: {
        envVars: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"],
        redirectUri,
      },
    });
  }

  const state = generateOAuthState();
  const authUrl = buildGoogleAuthUrl(state);

  const res = NextResponse.json({
    configured: true,
    url: authUrl,
    redirectUri,
  });

  res.cookies.set("google_oauth_state", state, {
    httpOnly: true,
    secure: false,
    path: "/",
    maxAge: 600,
    sameSite: "lax",
  });

  return res;
}
