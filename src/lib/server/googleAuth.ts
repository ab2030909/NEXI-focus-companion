import crypto from "crypto";
import fs from "fs";
import path from "path";

export function readEnvVar(key: string): string | undefined {
  if (process.env[key]) return process.env[key];
  try {
    const envPath = path.join(process.cwd(), ".env.local");
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf-8");
      for (const line of content.split("\n")) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith("#")) {
          const eqIdx = trimmed.indexOf("=");
          if (eqIdx !== -1) {
            const k = trimmed.slice(0, eqIdx).trim();
            const v = trimmed.slice(eqIdx + 1).trim();
            if (k === key) return v;
          }
        }
      }
    }
  } catch {
    // Ignore fs errors
  }
  return undefined;
}

export function getGoogleClientId(): string | undefined {
  return readEnvVar("GOOGLE_CLIENT_ID") || process.env.GOOGLE_CLIENT_ID?.trim();
}

export function getGoogleClientSecret(): string | undefined {
  return readEnvVar("GOOGLE_CLIENT_SECRET") || process.env.GOOGLE_CLIENT_SECRET?.trim();
}

export function getAppBaseUrl(): string {
  return (
    readEnvVar("NEXT_PUBLIC_APP_URL") ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000"
  ).replace(/\/$/, "");
}

export function getGoogleRedirectUri(): string {
  return `${getAppBaseUrl()}/api/auth/callback/google`;
}

export function isGoogleOAuthConfigured(): boolean {
  const clientId = getGoogleClientId();
  const clientSecret = getGoogleClientSecret();
  return Boolean(
    clientId &&
    clientSecret &&
    clientId.length > 5 &&
    clientSecret.length > 5 &&
    !clientId.includes("your_google_")
  );
}

export function generateOAuthState(): string {
  return crypto.randomBytes(24).toString("hex");
}

export function buildGoogleAuthUrl(state: string): string {
  const clientId = getGoogleClientId();
  if (!clientId) throw new Error("GOOGLE_CLIENT_ID is not configured.");

  const redirectUri = getGoogleRedirectUri();
  const scope = encodeURIComponent("openid email profile");

  return (
    `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${encodeURIComponent(clientId)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&response_type=code` +
    `&scope=${scope}` +
    `&state=${encodeURIComponent(state)}` +
    `&access_type=offline` +
    `&prompt=select_account`
  );
}

export interface GoogleUserInfo {
  sub: string;
  email: string;
  name: string;
  picture?: string;
  email_verified?: boolean;
}

export async function exchangeCodeForGoogleUser(code: string): Promise<GoogleUserInfo> {
  const clientId = getGoogleClientId();
  const clientSecret = getGoogleClientSecret();
  const redirectUri = getGoogleRedirectUri();

  if (!clientId || !clientSecret) {
    throw new Error("Missing Google OAuth credentials on server.");
  }

  // 1. Exchange authorization code for tokens
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenRes.ok) {
    const errorBody = await tokenRes.text();
    throw new Error(`Google token exchange failed: ${errorBody}`);
  }

  const tokenData = await tokenRes.json();
  const accessToken = tokenData.access_token;

  if (!accessToken) {
    throw new Error("No access_token returned by Google OAuth.");
  }

  // 2. Fetch verified user info using Google's userinfo endpoint
  const userRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!userRes.ok) {
    throw new Error("Failed to retrieve user info from Google.");
  }

  const userData: GoogleUserInfo = await userRes.json();
  if (!userData.email) {
    throw new Error("Google identity did not return a valid email address.");
  }

  return userData;
}
